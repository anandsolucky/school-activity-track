'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

interface Class {
  id: string;
  name: string;
}

interface StudentActivity {
  studentId: string;
  name: string;
  rollNumber?: string;
  attendance: boolean;
  classwork: boolean;
  remarks: string;
}

export default function NewActivityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<StudentActivity[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lessonTitle, setLessonTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch teacher's classes
  useEffect(() => {
    async function fetchClasses() {
      if (!user) return;

      try {
        const classesQuery = query(
          collection(db, 'classes'),
          where('teacherId', '==', user.uid)
        );

        const querySnapshot = await getDocs(classesQuery);
        const fetchedClasses = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));

        setClasses(fetchedClasses);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes');
        setLoading(false);
      }
    }

    fetchClasses();
  }, [user]);

  // Fetch students when a class is selected
  useEffect(() => {
    async function fetchStudents() {
      if (!selectedClass) {
        setStudents([]);
        return;
      }

      try {
        setLoading(true);
        const studentsQuery = query(
          collection(db, 'students'),
          where('classId', '==', selectedClass)
        );

        const querySnapshot = await getDocs(studentsQuery);
        const fetchedStudents = querySnapshot.docs.map((doc) => ({
          studentId: doc.id,
          name: doc.data().name,
          rollNumber: doc.data().rollNumber,
          attendance: true, // Default to present
          classwork: false, // Default to not completed
          remarks: '',
        }));

        setStudents(fetchedStudents);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, [selectedClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !lessonTitle.trim() || !date) {
      setError('Please fill in all required fields');
      return;
    }

    if (students.length === 0) {
      setError('No students found in this class');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Check if an activity already exists for this date and class
      const existingActivityQuery = query(
        collection(db, 'activities'),
        where('classId', '==', selectedClass),
        where('date', '==', date)
      );
      const existingActivity = await getDocs(existingActivityQuery);

      if (!existingActivity.empty) {
        setError('An activity already exists for this date and class');
        return;
      }

      // Create the activity
      const activityData = {
        classId: selectedClass,
        teacherId: user?.uid,
        date,
        lessonTitle: lessonTitle.trim(),
        students: students.map((student) => ({
          studentId: student.studentId,
          name: student.name,
          rollNumber: student.rollNumber,
          attendance: student.attendance,
          classwork: student.classwork,
          remarks: student.remarks.trim(),
        })),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'activities'), activityData);
      router.push('/dashboard/activities');
    } catch (err) {
      console.error('Error saving activity:', err);
      setError('Failed to save activity');
    } finally {
      setSaving(false);
    }
  };

  const updateStudentActivity = (
    studentId: string,
    field: keyof StudentActivity,
    value: boolean | string
  ) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.studentId === studentId
          ? { ...student, [field]: value }
          : student
      )
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Log New Activity
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link
            href="/dashboard/activities"
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              required
            />
          </div>

          <div>
            <label
              htmlFor="class"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Class
            </label>
            <select
              id="class"
              name="class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              required
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="lesson-title"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Lesson Title
          </label>
          <input
            type="text"
            id="lesson-title"
            name="lesson-title"
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="Enter lesson title"
            required
          />
        </div>

        {selectedClass && students.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Student Attendance & Performance
            </h3>
            <div className="mt-4 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                          Student Name
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Roll Number
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Attendance
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Classwork
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.studentId}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                            {student.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {student.rollNumber || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <input
                              type="checkbox"
                              checked={student.attendance}
                              onChange={(e) =>
                                updateStudentActivity(
                                  student.studentId,
                                  'attendance',
                                  e.target.checked
                                )
                              }
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <input
                              type="checkbox"
                              checked={student.classwork}
                              onChange={(e) =>
                                updateStudentActivity(
                                  student.studentId,
                                  'classwork',
                                  e.target.checked
                                )
                              }
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <input
                              type="text"
                              value={student.remarks}
                              onChange={(e) =>
                                updateStudentActivity(
                                  student.studentId,
                                  'remarks',
                                  e.target.value
                                )
                              }
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                              placeholder="Add remarks"
                            />
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

        <div className="flex justify-end gap-x-3">
          <Link
            href="/dashboard/activities"
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !selectedClass || students.length === 0}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Activity'}
          </button>
        </div>
      </form>
    </div>
  );
}
