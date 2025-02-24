'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  BookOpen,
  CalendarDays,
  GraduationCap,
} from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/contexts/AuthContext';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Class {
  id: string;
  name: string;
}

interface ActivityStudent {
  id: string;
  name: string;
  rollNumber?: string;
  isPresent: boolean;
  remarks?: string;
}

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Activity title must be at least 2 characters.',
  }),
  date: z.date({
    required_error: 'Please select a date.',
  }),
  classId: z.string({
    required_error: 'Please select a class.',
  }),
});

export default function NewActivityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<ActivityStudent[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      date: new Date(),
      classId: '',
    },
  });

  useEffect(() => {
    async function fetchClasses() {
      if (!user) return;
      try {
        const classesQuery = query(
          collection(db, 'classes'),
          where('teacherId', '==', user.uid)
        );
        const snapshot = await getDocs(classesQuery);
        const classesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setClasses(classesData);
      } catch (err) {
        console.error('Error fetching classes:', err);
        toast.error('Failed to load classes');
      }
    }

    fetchClasses();
  }, [user]);

  const handleClassChange = async (classId: string) => {
    form.setValue('classId', classId);
    if (!classId) {
      setStudents([]);
      return;
    }

    try {
      const studentsQuery = query(
        collection(db, 'students'),
        where('classId', '==', classId)
      );
      const snapshot = await getDocs(studentsQuery);
      const studentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        rollNumber: doc.data().rollNumber,
        isPresent: true,
        remarks: '',
      }));
      studentsData.sort((a, b) => a.name.localeCompare(b.name));
      setStudents(studentsData);
    } catch (err) {
      console.error('Error fetching students:', err);
      toast.error('Failed to load students');
    }
  };

  const handleStudentChange = (
    studentId: string,
    field: 'isPresent' | 'remarks',
    value: boolean | string
  ) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, [field]: value } : student
      )
    );
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (students.length === 0) {
      toast.error('Please select a class with students');
      return;
    }

    setLoading(true);
    try {
      const selectedClassData = classes.find((c) => c.id === values.classId);
      if (!selectedClassData) throw new Error('Class not found');

      // Check for existing activity
      const startOfDay = new Date(values.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(values.date);
      endOfDay.setHours(23, 59, 59, 999);

      const existingActivityQuery = query(
        collection(db, 'activities'),
        where('classId', '==', values.classId),
        where('date', '>=', startOfDay.toISOString()),
        where('date', '<=', endOfDay.toISOString())
      );

      const existingActivitySnapshot = await getDocs(existingActivityQuery);
      if (!existingActivitySnapshot.empty) {
        toast.error(
          'An activity already exists for this class on the selected date',
          {
            description: 'Please choose a different date or class',
          }
        );
        return;
      }

      const activityData = {
        title: values.title.trim(),
        date: values.date.toISOString(),
        classId: values.classId,
        className: selectedClassData.name,
        teacherId: user?.uid,
        students: students.map((student) => ({
          id: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
          isPresent: student.isPresent,
          remarks: student.remarks?.trim() || null,
        })),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'activities'), activityData);
      toast.success('Activity created successfully');
      router.push('/dashboard');
    } catch (err) {
      console.error('Error creating activity:', err);
      toast.error('Failed to create activity');
    } finally {
      setLoading(false);
    }
  };

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
                New Activity
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 max-w-3xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Title</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <BookOpen className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                          <Input
                            placeholder="e.g., Newton's First Law - Chapter 5"
                            className="pl-10 bg-white"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <div className="relative">
                                <CalendarDays className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <Button
                                  variant="outline"
                                  className="w-full pl-10 text-left font-normal bg-white"
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span className="text-slate-400">
                                      Pick a date
                                    </span>
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select
                          onValueChange={handleClassChange}
                          value={field.value}
                        >
                          <FormControl>
                            <div className="relative">
                              <GraduationCap className="absolute left-3 top-2.5 h-5 w-5 text-slate-400 pointer-events-none" />
                              <SelectTrigger className="pl-10 bg-white">
                                <SelectValue placeholder="Select a class" />
                              </SelectTrigger>
                            </div>
                          </FormControl>
                          <SelectContent>
                            {classes.map((classItem) => (
                              <SelectItem
                                key={classItem.id}
                                value={classItem.id}
                              >
                                {classItem.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {students.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Student Attendance & Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="pb-6 border-b border-slate-200 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`present-${student.id}`}
                              checked={student.isPresent}
                              onCheckedChange={(checked) =>
                                handleStudentChange(
                                  student.id,
                                  'isPresent',
                                  checked as boolean
                                )
                              }
                            />
                            <Label
                              htmlFor={`present-${student.id}`}
                              className="text-base font-medium"
                            >
                              {student.name}
                              {student.rollNumber && (
                                <span className="ml-2 text-sm text-slate-500">
                                  ({student.rollNumber})
                                </span>
                              )}
                            </Label>
                          </div>
                        </div>
                        <div className="mt-2 pl-6">
                          <Textarea
                            placeholder="Add remarks (optional)"
                            value={student.remarks}
                            onChange={(e) =>
                              handleStudentChange(
                                student.id,
                                'remarks',
                                e.target.value
                              )
                            }
                            className="resize-none bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                {loading ? 'Creating Activity...' : 'Create Activity'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
