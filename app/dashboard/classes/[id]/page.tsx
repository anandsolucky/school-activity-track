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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Pencil, UserPlus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Student {
  id: string;
  name: string;
  rollNumber?: string;
  createdAt: string;
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

function ClassDetailsContent({ classId }: { classId: string }) {
  const router = useRouter();
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

        // Sort students by name
        studentsData.sort((a, b) => a.name.localeCompare(b.name));
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

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this class?'
    );
    if (confirmed) {
      try {
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

        toast.success('Class deleted successfully');
        router.push('/dashboard/classes');
      } catch (err) {
        console.error('Error deleting class:', err);
        toast.error('Failed to delete class');
      }
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-slate-50"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-medium text-slate-900">
                {classDetails.name}
              </h1>
              {classDetails.description && (
                <p className="text-sm text-slate-500">
                  {classDetails.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 max-w-3xl mx-auto space-y-6">
        {/* Class Stats */}
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">
                  Total Students
                </p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Students</h2>
              <p className="text-sm text-slate-500">
                Manage your class students
              </p>
            </div>
            <Button
              onClick={() =>
                router.push(`/dashboard/classes/${classId}/students/add`)
              }
              className="bg-indigo-500 hover:bg-indigo-600"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Students
            </Button>
          </div>

          {students.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="py-8">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-indigo-500" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-900 mb-1">
                    No students yet
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Get started by adding students to this class
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(`/dashboard/classes/${classId}/students/add`)
                    }
                    className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Students
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50">
                <div className="grid grid-cols-12 px-6 py-3 text-sm font-medium text-slate-500">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-4">Roll Number</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>
              </div>
              <CardContent className="p-0">
                {students.map((student, index) => (
                  <div
                    key={student.id}
                    className={`grid grid-cols-12 px-6 py-4 items-center group hover:bg-slate-50 transition-colors ${
                      index !== students.length - 1
                        ? 'border-b border-slate-100'
                        : ''
                    }`}
                  >
                    <div className="col-span-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-medium text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {student.name}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-4">
                      <p className="text-sm text-slate-600">
                        {student.rollNumber || '-'}
                      </p>
                    </div>
                    <div className="col-span-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() =>
                          router.push(
                            `/dashboard/classes/${classId}/students/${student.id}/edit`
                          )
                        }
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Class Actions */}
        <Card className="mt-6 border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900">Class Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                onClick={() =>
                  router.push(`/dashboard/classes/${classId}/edit`)
                }
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Class
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Class
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Class</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this class? This action
                      will also delete all students and activities associated
                      with this class. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ClassDetailPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  return <ClassDetailsContent classId={resolvedParams.id} />;
}
