'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
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

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Student name must be at least 2 characters.',
  }),
  rollNumber: z.string().optional(),
});

interface PageProps {
  params: Promise<{
    id: string;
    studentId: string;
  }>;
}

function EditStudentContent({
  classId,
  studentId,
}: {
  classId: string;
  studentId: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [className, setClassName] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      rollNumber: '',
    },
  });

  useEffect(() => {
    async function fetchDetails() {
      if (!user) return;
      try {
        // Verify class ownership
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (!classDoc.exists()) {
          setError('Class not found');
          return;
        }

        const classData = classDoc.data();
        if (classData.teacherId !== user.uid) {
          setError('You do not have permission to edit this student');
          return;
        }

        setClassName(classData.name);

        // Fetch student details
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        if (!studentDoc.exists()) {
          setError('Student not found');
          return;
        }

        const studentData = studentDoc.data();
        form.reset({
          name: studentData.name,
          rollNumber: studentData.rollNumber || '',
        });
      } catch (err) {
        console.error('Error fetching details:', err);
        setError('Failed to load student details');
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [classId, studentId, user, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateDoc(doc(db, 'students', studentId), {
        name: values.name,
        rollNumber: values.rollNumber?.trim() || null,
      });

      toast.success('Student updated successfully');
      router.push(`/dashboard/classes/${classId}`);
    } catch (err) {
      console.error('Error updating student:', err);
      toast.error('Failed to update student');
    }
  };

  const handleDelete = async () => {
    try {
      // Delete the student
      await deleteDoc(doc(db, 'students', studentId));

      // Update class student count
      const classRef = doc(db, 'classes', classId);
      const classDoc = await getDoc(classRef);
      if (classDoc.exists()) {
        await updateDoc(classRef, {
          studentCount: (classDoc.data().studentCount || 1) - 1,
        });
      }

      toast.success('Student deleted successfully');
      router.push(`/dashboard/classes/${classId}`);
    } catch (err) {
      console.error('Error deleting student:', err);
      toast.error('Failed to delete student');
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
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-500"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="px-4 py-3 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-slate-50"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-medium text-slate-900">Edit Student</h1>
            <p className="text-sm text-slate-500">{className}</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <p className="text-sm text-slate-500">
              Update the student&apos;s details
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter student name"
                          {...field}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rollNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roll Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter roll number"
                          {...field}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        Delete Student
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Student</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this student? This
                          action cannot be undone.
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
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EditStudentPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  return (
    <EditStudentContent
      classId={resolvedParams.id}
      studentId={resolvedParams.studentId}
    />
  );
}
