'use client';

import React, { useEffect, useState } from 'react';
import { Plus, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Spinner } from '@/components/ui/Spinner';

interface Activity {
  id: string;
  title: string;
  date: string;
  className: string;
  classId: string;
}

interface Class {
  id: string;
  name: string;
  studentCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayClasses, setTodayClasses] = useState<Class[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        // Fetch today's classes
        const classesQuery = query(
          collection(db, 'classes'),
          where('teacherId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const classesSnapshot = await getDocs(classesQuery);
        const classesData = classesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Class[];
        setTodayClasses(classesData);

        // Fetch recent activities
        const activitiesQuery = query(
          collection(db, 'activities'),
          where('teacherId', '==', user.uid),
          orderBy('date', 'desc'),
          limit(5)
        );
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activitiesData = activitiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Activity[];
        setRecentActivities(activitiesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="px-4 py-3 flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-indigo-500" />
          <h1 className="text-lg font-medium text-slate-900">Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4">
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="today"
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
            >
              Today&apos;s Classes
            </TabsTrigger>
            <TabsTrigger
              value="recent"
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
            >
              Recent Activities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {todayClasses.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="py-8">
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-slate-900 mb-1">
                      No Classes Yet
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Start by creating your first class
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard/classes/new')}
                      className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Class
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              todayClasses.map((classItem) => (
                <Card
                  key={classItem.id}
                  className="hover:bg-slate-50 cursor-pointer border-slate-200 transition-colors"
                  onClick={() =>
                    router.push(`/dashboard/classes/${classItem.id}`)
                  }
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-bold text-slate-900">
                      {classItem.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">
                      {classItem.studentCount} students
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            {recentActivities.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="py-8">
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-slate-900 mb-1">
                      No Activities Yet
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Start by creating your first activity
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/dashboard/activities/new')}
                      className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Activity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              recentActivities.map((activity) => (
                <Card
                  key={activity.id}
                  className="hover:bg-slate-50 cursor-pointer border-slate-200 transition-colors"
                  onClick={() =>
                    router.push(`/dashboard/activities/${activity.id}`)
                  }
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-bold text-slate-900">
                      {activity.title}
                    </CardTitle>
                    <p className="text-sm text-slate-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">
                      {activity.className}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-20 right-4 rounded-full shadow-lg bg-indigo-500 hover:bg-indigo-600 transition-colors"
        onClick={() => router.push('/dashboard/activities/new')}
      >
        <Plus className="h-5 w-5" />
      </Button>
    </main>
  );
}
