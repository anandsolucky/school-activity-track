'use client';

import React, { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';

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

export default function ClassDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useAuth();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchClassDetails() {
      if (!user) return;

      try {
        // Fetch class details
        const classDoc = await getDoc(doc(db, 'classes', params.id));
        if (!classDoc.exists()) {
          setError('Class not found');
          return;
        }

        const classData = classDoc.data() as Omit<ClassDetails, 'id'>;
        if (classData.teacherId !== user.uid) {
          setError('You do not have permission to view this class');
          return;
        }

        setClassDetails({ id: classDoc.id, ...classData });

        // Fetch students in this class
        const studentsQuery = query(
          collection(db, 'students'),
          where('classId', '==', params.id)
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
  }, [params.id, user]);

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
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {classDetails.name}
          </h2>
          {classDetails.description && (
            <p className="mt-2 text-sm text-gray-500">
              {classDetails.description}
            </p>
          )}
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link
            href={`/dashboard/classes/${params.id}/add-students`}
            className="ml-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Add Students
          </Link>
        </div>
      </div>

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
                href={`/dashboard/classes/${params.id}/add-students`}
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
