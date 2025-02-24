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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Class name must be at least 2 characters.',
  }),
  subject: z.string().min(2, {
    message: 'Subject must be at least 2 characters.',
  }),
  description: z.string().optional(),
});

interface PageProps {
  params: {
    id: string;
  };
}

function EditClassContent({ classId }: { classId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      subject: '',
      description: '',
    },
  });

  useEffect(() => {
    async function fetchClassDetails() {
      if (!user) return;
      try {
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (!classDoc.exists()) {
          setError('Class not found');
          return;
        }

        const classData = classDoc.data();
        if (classData.teacherId !== user.uid) {
          setError('You do not have permission to edit this class');
          return;
        }

        form.reset({
          name: classData.name,
          subject: classData.subject,
          description: classData.description || '',
        });
      } catch (err) {
        console.error('Error fetching class:', err);
        setError('Failed to load class details');
      } finally {
        setLoading(false);
      }
    }

    fetchClassDetails();
  }, [classId, user, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateDoc(doc(db, 'classes', classId), {
        name: values.name,
        subject: values.subject,
        description: values.description || null,
      });

      toast.success('Class updated successfully');
      router.push(`/dashboard/classes/${classId}`);
    } catch (err) {
      console.error('Error updating class:', err);
      toast.error('Failed to update class');
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
          <h1 className="text-lg font-medium text-slate-900">Edit Class</h1>
        </div>
      </header>

      {/* Form */}
      <div className="p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <p className="text-sm text-slate-500">
              Update the details for your class
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
                      <FormLabel>Class Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Class 10A"
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
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Mathematics"
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional details about the class"
                          className="resize-none bg-white"
                          {...field}
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
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EditClassPage({ params }: PageProps) {
  return <EditClassContent classId={params.id} />;
}
