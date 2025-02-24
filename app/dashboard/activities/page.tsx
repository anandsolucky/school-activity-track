'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

interface Activity {
  id: string;
  classId: string;
  className?: string;
  date: string;
  lessonTitle: string;
  studentCount: number;
  createdAt: string;
}

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchActivities() {
      if (!user) return;

      try {
        // Fetch activities
        const activitiesQuery = query(
          collection(db, 'activities'),
          where('teacherId', '==', user.uid),
          orderBy('date', 'desc')
        );

        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activitiesData = activitiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          studentCount: doc.data().students?.length || 0,
        })) as Activity[];

        // Fetch class names for each activity
        const classIds = Array.from(
          new Set(activitiesData.map((a) => a.classId))
        );
        const classesData: { [key: string]: string } = {};

        for (const classId of classIds) {
          const classQuery = query(
            collection(db, 'classes'),
            where('teacherId', '==', user.uid)
          );
          const classSnapshot = await getDocs(classQuery);
          const classDoc = classSnapshot.docs.find((doc) => doc.id === classId);
          if (classDoc) {
            classesData[classId] = classDoc.data().name;
          }
        }

        // Add class names to activities
        const activitiesWithClassNames = activitiesData.map((activity) => ({
          ...activity,
          className: classesData[activity.classId] || 'Unknown Class',
        }));

        setActivities(activitiesWithClassNames);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load activities');
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
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
            Activities
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link
            href="/dashboard/activities/new"
            className="ml-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Log New Activity
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 text-red-500 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="mt-6">
        {activities.length === 0 ? (
          <div className="text-center bg-white rounded-lg shadow-sm p-12">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No activities
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by logging a new activity.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/activities/new"
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Log New Activity
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden bg-white shadow sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {activities.map((activity) => (
                <li key={activity.id}>
                  <Link
                    href={`/dashboard/activities/${activity.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="truncate text-sm font-medium text-blue-600">
                            {activity.lessonTitle}
                          </p>
                        </div>
                        <div className="ml-2 flex flex-shrink-0">
                          <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                            {activity.studentCount} students
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {activity.className}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>{new Date(activity.date).toLocaleDateString()}</p>
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
