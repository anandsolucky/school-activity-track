'use client';

import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { useRouter } from 'next/navigation';
import { Plus, Users, ChevronRight, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Class {
  id: string;
  name: string;
  studentCount: number;
  createdAt: Timestamp | string | { seconds: number; nanoseconds: number };
}

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchClasses() {
      if (!user) return;

      try {
        const classesQuery = query(
          collection(db, 'classes'),
          where('teacherId', '==', user.uid)
        );

        const querySnapshot = await getDocs(classesQuery);
        const fetchedClasses = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log('Class data:', data); // Debug: log the raw data
          return {
            id: doc.id,
            ...data,
          };
        }) as Class[];

        console.log('Fetched classes:', fetchedClasses); // Debug: log all classes
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

  // Helper function to check if an object is a Firestore Timestamp
  const isFirestoreTimestamp = (value: unknown): value is Timestamp => {
    return (
      value !== null &&
      typeof value === 'object' &&
      'toDate' in value &&
      typeof (value as Timestamp).toDate === 'function'
    );
  };

  // Helper function to check if an object has seconds property
  const isTimestampLike = (
    value: unknown
  ): value is { seconds: number; nanoseconds: number } => {
    return (
      value !== null &&
      typeof value === 'object' &&
      'seconds' in value &&
      typeof (value as { seconds: number }).seconds === 'number'
    );
  };

  // Helper function to format date safely
  const formatDate = (timestamp: unknown): string => {
    if (!timestamp) return 'Unknown date';

    try {
      // Handle Firestore Timestamp
      if (isFirestoreTimestamp(timestamp)) {
        return timestamp.toDate().toLocaleDateString();
      }

      // Handle timestamp object with seconds and nanoseconds
      if (isTimestampLike(timestamp)) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
      }

      // Handle string date
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString();
      }

      // Handle regular Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }

      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error, timestamp);
      return 'Invalid date';
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
      <div className="flex justify-center items-center min-h-[400px] text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-medium text-primary">Classes</h1>
          </div>
        </div>
      </header>

      {/* Class List */}
      <div className="p-4 space-y-4">
        {classes.map((classItem) => (
          <Card
            key={classItem.id}
            className="overflow-hidden hover:shadow-md cursor-pointer border-slate-200 transition-all duration-200 group"
            onClick={() => router.push(`/dashboard/classes/${classItem.id}`)}
          >
            <div className="relative">
              {/* Class Status Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

              <CardHeader className="space-y-0 pb-2 pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                        {classItem.name}
                      </CardTitle>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        Created {formatDate(classItem.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-4">
                    {/* Student Count */}
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">
                        {classItem.studentCount} Students
                      </span>
                    </div>
                  </div>

                  {/* View Details */}
                  <div className="flex items-center text-sm text-primary font-medium">
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}

        {classes.length === 0 && (
          <Card className="border-slate-200">
            <CardContent className="py-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-sm font-medium text-slate-900 mb-1">
                  No Classes Yet
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Create your first class to get started
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/classes/new')}
                  className="border-primary/20 text-primary hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Class
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-20 right-4 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all flex items-center gap-2 px-6"
        onClick={() => router.push('/dashboard/classes/new')}
      >
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          <span className="font-medium">Add Class</span>
        </div>
      </Button>
    </div>
  );
}
