'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
  createdAt: string;
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
            <GraduationCap className="h-5 w-5 text-indigo-500" />
            <h1 className="text-lg font-medium text-indigo-500">Classes</h1>
          </div>
        </div>
      </header>

      {/* Class List */}
      <div className="p-4 space-y-4">
        {classes.map((classItem) => (
          <Card
            key={classItem.id}
            className="hover:bg-slate-50 cursor-pointer border-slate-200 transition-colors"
            onClick={() => router.push(`/dashboard/classes/${classItem.id}`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  {classItem.name}
                </CardTitle>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-slate-600">
                <Users className="mr-2 h-4 w-4" />
                {classItem.studentCount} students
              </div>
            </CardContent>
          </Card>
        ))}

        {classes.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-1">
              No Classes Yet
            </h3>
            <p className="text-sm text-slate-500">
              Create your first class to get started
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-20 right-4 rounded-full shadow-lg bg-indigo-500 hover:bg-indigo-600 transition-colors"
        onClick={() => router.push('/dashboard/classes/new')}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Class
      </Button>
    </div>
  );
}
