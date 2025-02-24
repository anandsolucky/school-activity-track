'use client';

import React, { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  name: string;
  email?: string;
  rollNumber?: string;
}

interface ClassDetails {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  studentCount: number;
  createdAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClassDetailPage({ params }: PageProps) {
  const classId = React.use(params).id;
  const router = useRouter();
  const { user } = useAuth();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function fetchClassDetails() {
      if (!user) return;

      try {
        // Fetch class details
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (!classDoc.exists()) {
          setError('Class not found');
          return;
        }

        const classData = classDoc.data() as Omit<ClassDetails, 'id'>;
        if (classData.teacherId !== user.uid) {
          setError('You do not have permission to view this class');
          return;
        }

        const classWithId = { id: classDoc.id, ...classData };
        setClassDetails(classWithId);
        setEditedName(classWithId.name);
        setEditedDescription(classWithId.description || '');

        // Fetch students in this class
        const studentsQuery = query(
          collection(db, 'students'),
          where('classId', '==', classId)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsData = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Student[];

        setStudents(studentsData);
      } catch (err) {
        console.error('Error fetching class details:', err);
        setError('Failed to load class details');
      } finally {
        setLoading(false);
      }
    }

    fetchClassDetails();
  }, [classId, user]);

  const handleSaveEdit = async () => {
    if (!editedName.trim()) {
      setError('Class name is required');
      return;
    }

    try {
      await updateDoc(doc(db, 'classes', classId), {
        name: editedName.trim(),
        description: editedDescription.trim() || null,
        updatedAt: new Date().toISOString(),
      });

      setClassDetails((prev) =>
        prev
          ? {
              ...prev,
              name: editedName.trim(),
              description: editedDescription.trim(),
            }
          : null
      );
      setIsEditing(false);
      setError('');
    } catch (err) {
      console.error('Error updating class:', err);
      setError('Failed to update class');
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      setError('');

      // Delete all students in the class
      const studentsQuery = query(
        collection(db, 'students'),
        where('classId', '==', classId)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const deleteStudentsPromises = studentsSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deleteStudentsPromises);

      // Delete all activities for this class
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('classId', '==', classId)
      );
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const deleteActivitiesPromises = activitiesSnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deleteActivitiesPromises);

      // Delete the class
      await deleteDoc(doc(db, 'classes', classId));

      router.push('/dashboard/classes');
    } catch (err) {
      console.error('Error deleting class:', err);
      setError('Failed to delete class');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-4">
          {error}
        </div>
        <Link
          href="/dashboard/classes"
          className="text-blue-600 hover:text-blue-500"
        >
          Back to Classes
        </Link>
      </div>
    );
  }

  if (!classDetails) {
    return null;
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Class Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter class name"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Add a description"
                />
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                {classDetails.name}
              </h2>
              {classDetails.description && (
                <p className="mt-2 text-sm text-gray-500">
                  {classDetails.description}
                </p>
              )}
            </>
          )}
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditedName(classDetails.name);
                  setEditedDescription(classDetails.description || '');
                  setError('');
                }}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Edit Class
              </button>
              <Link
                href={`/dashboard/classes/${classId}/add-students`}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Add Students
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Class'}
              </button>
            </>
          )}
        </div>
      </div>

      {showDeleteConfirm && !isDeleting && (
        <div className="mt-4 bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">
            Are you sure you want to delete this class? This will also delete
            all students and activities associated with this class. This action
            cannot be undone.
          </p>
          <div className="mt-4 flex space-x-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Yes, Delete Class
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Students
            </h3>
            <p className="mt-2 text-sm text-gray-700">
              A list of all students in this class.
            </p>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="text-center bg-white rounded-lg shadow-sm p-12 mt-6">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No students
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding students to this class.
            </p>
            <div className="mt-6">
              <Link
                href={`/dashboard/classes/${classId}/add-students`}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Add Students
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Roll Number
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {students.map((student) => (
                        <tr key={student.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {student.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {student.rollNumber || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {student.email || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
