'use client';

import React, { useEffect, useState } from 'react';
import { Plus, LayoutDashboard, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Spinner } from '@/components/ui/Spinner';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Activity {
  id: string;
  title: string;
  date: string;
  className: string;
  classId: string;
  students: Array<{
    id: string;
    isPresent: boolean;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayActivities, setTodayActivities] = useState<Activity[]>([]);
  const [pastActivities, setPastActivities] = useState<Activity[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        // Get today's date range
        const today = new Date();
        const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const todayEnd = new Date(
          today.setHours(23, 59, 59, 999)
        ).toISOString();

        // Fetch today's activities
        const todayActivitiesQuery = query(
          collection(db, 'activities'),
          where('teacherId', '==', user.uid),
          where('date', '>=', todayStart),
          where('date', '<=', todayEnd),
          orderBy('date', 'desc')
        );
        const todaySnapshot = await getDocs(todayActivitiesQuery);
        const todayData = todaySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Activity[];
        setTodayActivities(todayData);

        // If a date is selected, fetch activities for that date
        if (selectedDate) {
          const selectedStart = new Date(
            selectedDate.setHours(0, 0, 0, 0)
          ).toISOString();
          const selectedEnd = new Date(
            selectedDate.setHours(23, 59, 59, 999)
          ).toISOString();

          const pastActivitiesQuery = query(
            collection(db, 'activities'),
            where('teacherId', '==', user.uid),
            where('date', '>=', selectedStart),
            where('date', '<=', selectedEnd),
            orderBy('date', 'desc')
          );
          const pastSnapshot = await getDocs(pastActivitiesQuery);
          const pastData = pastSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Activity[];
          setPastActivities(pastData);
        } else {
          setPastActivities([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user, selectedDate]);

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
              Today&apos;s Activities
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
            >
              Past Activities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {todayActivities.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="py-8">
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-slate-900 mb-1">
                      No Activities Today
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Start by creating your first activity for today
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
              todayActivities.map((activity) => (
                <Card
                  key={activity.id}
                  className="overflow-hidden hover:shadow-md cursor-pointer border-slate-200 transition-all duration-200 group"
                  onClick={() =>
                    router.push(`/dashboard/activities/${activity.id}`)
                  }
                >
                  <div className="relative">
                    {/* Activity Status Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />

                    <CardHeader className="space-y-0 pb-2 pt-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-indigo-50 p-2 rounded-lg">
                            <CalendarIcon className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {activity.title}
                            </CardTitle>
                            <p className="text-sm text-slate-500 flex items-center gap-2">
                              {activity.className}
                              <span className="inline-block w-1 h-1 rounded-full bg-slate-300" />
                              {new Date(activity.date).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4">
                          {/* Present Students */}
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-sm font-medium text-slate-700">
                              {
                                activity.students.filter((s) => s.isPresent)
                                  .length
                              }{' '}
                              Present
                            </span>
                          </div>
                          {/* Absent Students */}
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-sm font-medium text-slate-700">
                              {
                                activity.students.filter((s) => !s.isPresent)
                                  .length
                              }{' '}
                              Absent
                            </span>
                          </div>
                        </div>

                        {/* Attendance Percentage */}
                        <div className="bg-slate-50 px-3 py-1 rounded-full">
                          <span className="text-sm font-semibold text-slate-700">
                            {Math.round(
                              (activity.students.filter((s) => s.isPresent)
                                .length /
                                activity.students.length) *
                                100
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? format(selectedDate, 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {selectedDate ? (
              pastActivities.length === 0 ? (
                <Card className="border-slate-200">
                  <CardContent className="py-8">
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-slate-900 mb-1">
                        No Activities Found
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">
                        No activities were recorded on{' '}
                        {format(selectedDate, 'PPP')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                pastActivities.map((activity) => (
                  <Card
                    key={activity.id}
                    className="overflow-hidden hover:shadow-md cursor-pointer border-slate-200 transition-all duration-200 group"
                    onClick={() =>
                      router.push(`/dashboard/activities/${activity.id}`)
                    }
                  >
                    <div className="relative">
                      {/* Activity Status Bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />

                      <CardHeader className="space-y-0 pb-2 pt-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 p-2 rounded-lg">
                              <CalendarIcon className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {activity.title}
                              </CardTitle>
                              <p className="text-sm text-slate-500 flex items-center gap-2">
                                {activity.className}
                                <span className="inline-block w-1 h-1 rounded-full bg-slate-300" />
                                {new Date(activity.date).toLocaleTimeString(
                                  [],
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-4">
                            {/* Present Students */}
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-sm font-medium text-slate-700">
                                {
                                  activity.students.filter((s) => s.isPresent)
                                    .length
                                }{' '}
                                Present
                              </span>
                            </div>
                            {/* Absent Students */}
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              <span className="text-sm font-medium text-slate-700">
                                {
                                  activity.students.filter((s) => !s.isPresent)
                                    .length
                                }{' '}
                                Absent
                              </span>
                            </div>
                          </div>

                          {/* Attendance Percentage */}
                          <div className="bg-slate-50 px-3 py-1 rounded-full">
                            <span className="text-sm font-semibold text-slate-700">
                              {Math.round(
                                (activity.students.filter((s) => s.isPresent)
                                  .length /
                                  activity.students.length) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))
              )
            ) : (
              <Card className="border-slate-200">
                <CardContent className="py-8">
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-slate-900 mb-1">
                      Select a Date
                    </h3>
                    <p className="text-sm text-slate-500">
                      Choose a date to view past activities
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-20 right-4 rounded-full shadow-lg bg-indigo-500 hover:bg-indigo-600 transition-colors flex items-center gap-2 px-6"
        onClick={() => router.push('/dashboard/activities/new')}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <span className="font-medium">Log Activity</span>
        </div>
      </Button>
    </main>
  );
}
