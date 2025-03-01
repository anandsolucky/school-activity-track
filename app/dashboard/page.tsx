'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Spinner } from '@/components/ui/Spinner';
import { format } from 'date-fns';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

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

// Academic menu items based on screenshots
const academicItems = [
  {
    name: 'Attendance',
    icon: '/images/attendance.svg',
    href: '/dashboard/activities',
    color: 'bg-pink-100',
  },
  {
    name: 'Homework',
    icon: '/images/homework.svg',
    href: '/dashboard/activities',
    color: 'bg-blue-100',
  },
  {
    name: 'Remarks',
    icon: '/images/remarks.svg',
    href: '/dashboard/activities',
    color: 'bg-green-100',
  },
  {
    name: 'Photo Gallery',
    icon: '/images/gallery.svg',
    href: '/dashboard/activities',
    color: 'bg-orange-100',
  },
  {
    name: 'Class Work',
    icon: '/images/classwork.svg',
    href: '/dashboard/activities',
    color: 'bg-pink-100',
  },
  {
    name: 'Subjectwise H.W.',
    icon: '/images/subject.svg',
    href: '/dashboard/activities',
    color: 'bg-teal-100',
  },
];

// Download menu items
const downloadItems = [
  {
    name: 'Syllabus',
    icon: '/images/syllabus.svg',
    href: '/dashboard/reports',
    color: 'bg-teal-100',
  },
  {
    name: 'Assignment',
    icon: '/images/assignment.svg',
    href: '/dashboard/reports',
    color: 'bg-purple-100',
  },
  {
    name: 'Time Table',
    icon: '/images/timetable.svg',
    href: '/dashboard/reports',
    color: 'bg-pink-100',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayActivities, setTodayActivities] = useState<Activity[]>([]);
  const [greeting, setGreeting] = useState('Good Morning');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) {
      setGreeting('Good Afternoon');
    } else if (hour >= 17) {
      setGreeting('Good Evening');
    }

    // Extract first name if available
    if (user?.displayName) {
      const nameParts = user.displayName.split(' ');
      setUserName(nameParts[0].toUpperCase());
    }

    fetchDashboardData();
  }, [user]);

  async function fetchDashboardData() {
    if (!user) return;

    try {
      // Get today's date range
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentDate = format(new Date(), 'dd-MMM-yyyy');

  return (
    <div className="container max-w-md mx-auto px-4 pb-20">
      {/* Search Bar */}
      <div className="mt-4 relative">
        <div className="relative mb-6">
          <Input
            type="text"
            placeholder="Search menu"
            className="pl-10 pr-4 py-3 bg-gray-100 rounded-full shadow-sm focus-within:shadow-md transition-shadow"
          />
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Welcome Section */}
      <div className="mb-8 px-2">
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-5 rounded-2xl shadow-sm">
          <div className="flex flex-col">
            <div className="text-sm text-gray-600 mb-1">{currentDate}</div>
            <div className="text-xl text-primary font-medium">{greeting}</div>
            <div className="text-2xl font-bold text-primary mb-3">
              {userName}
            </div>
            <div className="mt-2 bg-white/90 py-2.5 px-4 rounded-xl text-center text-green-600 font-medium text-sm shadow-sm">
              You are present today
            </div>
          </div>
        </div>

        {/* Top Picks from Academics */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            <span className="w-1 h-6 bg-primary rounded-full mr-2"></span>
            Top picks from Academics
          </h2>
          {todayActivities.length > 0 ? (
            <div className="bg-orange-50 p-4 rounded-xl mb-3 shadow-sm hover:shadow-md transition-all border border-orange-100">
              <div className="text-pink-500 font-medium mb-1">
                Today&apos;s Class work
              </div>
              <div className="text-gray-700">
                {todayActivities[0].title} - {todayActivities[0].className}
              </div>
              <Link
                href={`/dashboard/activities/${todayActivities[0].id}`}
                className="flex justify-end"
              >
                <ChevronRight className="h-6 w-6 text-purple-500" />
              </Link>
            </div>
          ) : (
            <div className="text-center p-5 bg-gray-50 rounded-lg text-gray-500 border border-gray-100 shadow-sm">
              <div className="mb-2 text-gray-400">📝</div>
              No activities for today
            </div>
          )}
        </div>
      </div>

      {/* Academics Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 px-2 text-gray-800 flex items-center">
          <span className="w-1 h-6 bg-primary rounded-full mr-2"></span>
          Academics
        </h2>
        <div className="grid grid-cols-3 gap-5">
          {academicItems.map((item) => (
            <Link
              href={item.href}
              key={item.name}
              className="flex flex-col items-center group"
            >
              <div
                className={`${item.color} w-18 h-18 rounded-full flex items-center justify-center mb-2 shadow-sm group-hover:shadow-md transition-all duration-200`}
              >
                <img
                  src={item.icon}
                  alt={item.name}
                  className="w-8 h-8 group-hover:scale-110 transition-transform duration-200"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder.svg';
                  }}
                />
              </div>
              <span className="text-xs font-medium text-center text-gray-700 group-hover:text-primary transition-colors">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Downloads Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 px-2 text-gray-800 flex items-center">
          <span className="w-1 h-6 bg-secondary rounded-full mr-2"></span>
          Downloads
        </h2>
        <div className="grid grid-cols-3 gap-5">
          {downloadItems.map((item) => (
            <Link
              href={item.href}
              key={item.name}
              className="flex flex-col items-center group"
            >
              <div
                className={`${item.color} w-18 h-18 rounded-full flex items-center justify-center mb-2 shadow-sm group-hover:shadow-md transition-all duration-200`}
              >
                <img
                  src={item.icon}
                  alt={item.name}
                  className="w-8 h-8 group-hover:scale-110 transition-transform duration-200"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder.svg';
                  }}
                />
              </div>
              <span className="text-xs font-medium text-center text-gray-700 group-hover:text-primary transition-colors">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Add Activity Button */}
      <div className="fixed bottom-20 right-4">
        <Button
          onClick={() => router.push('/dashboard/activities/new')}
          size="icon"
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
