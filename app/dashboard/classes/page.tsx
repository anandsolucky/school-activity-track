'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

interface Class {
  id: string;
  name: string;
  studentCount: number;
  createdAt: string;
}

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          ...doc.data(),
        })) as Class[];

        setClasses(fetchedClasses);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes');
      } finally {
        setLoading(false);
      }
    }

    fetchClasses();
  }, [user]);

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
            Classes
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link
            href="/dashboard/classes/new"
            className="ml-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Add Class
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 text-red-500 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="mt-6">
        {classes.length === 0 ? (
          <div className="text-center bg-white rounded-lg shadow-sm p-12">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No classes
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new class.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/classes/new"
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Add Class
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden bg-white shadow sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {classes.map((classItem) => (
                <li key={classItem.id}>
                  <Link
                    href={`/dashboard/classes/${classItem.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="truncate text-sm font-medium text-blue-600">
                            {classItem.name}
                          </p>
                        </div>
                        <div className="ml-2 flex flex-shrink-0">
                          <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                            {classItem.studentCount || 0} students
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            Created{' '}
                            {new Date(classItem.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
