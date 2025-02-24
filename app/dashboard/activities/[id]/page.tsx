'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Pencil, X, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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

interface ActivityStudent {
  id: string;
  name: string;
  rollNumber?: string;
  isPresent: boolean;
  remarks?: string | null;
}

interface Activity {
  id: string;
  title: string;
  date: string;
  className: string;
  classId: string;
  teacherId: string;
  students: ActivityStudent[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function ActivityDetailsContent({ activityId }: { activityId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [students, setStudents] = useState<ActivityStudent[]>([]);

  useEffect(() => {
    async function fetchActivityDetails() {
      if (!user) return;
      try {
        const activityDoc = await getDoc(doc(db, 'activities', activityId));
        if (!activityDoc.exists()) {
          toast.error('Activity not found');
          router.back();
          return;
        }

        const activityData = {
          id: activityDoc.id,
          ...activityDoc.data(),
        } as Activity;

        if (activityData.teacherId !== user.uid) {
          toast.error('You do not have permission to view this activity');
          router.back();
          return;
        }

        setActivity(activityData);
        setStudents(activityData.students);
      } catch (err) {
        console.error('Error fetching activity:', err);
        toast.error('Failed to load activity details');
      } finally {
        setLoading(false);
      }
    }

    fetchActivityDetails();
  }, [activityId, user, router]);

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

  const handleSave = async () => {
    if (!activity) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'activities', activityId), {
        students: students.map((student) => ({
          id: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
          isPresent: student.isPresent,
          remarks: student.remarks?.trim() || null,
        })),
      });
      toast.success('Activity updated successfully');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating activity:', err);
      toast.error('Failed to update activity');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activity) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'activities', activityId));
      toast.success('Activity deleted successfully');
      router.push('/dashboard');
    } catch (err) {
      console.error('Error deleting activity:', err);
      toast.error('Failed to delete activity');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!activity) return null;

  const presentCount = students.filter((s) => s.isPresent).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
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
                {activity.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{activity.className}</span>
                <span>•</span>
                <span>{format(new Date(activity.date), 'PPP')}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {students.length}
                </div>
                <div className="text-sm text-slate-500">Total Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {presentCount}
                </div>
                <div className="text-sm text-slate-500">Present</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {absentCount}
                </div>
                <div className="text-sm text-slate-500">Absent</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card className="flex-1 min-h-[calc(100vh-24rem)]">
          <CardHeader className="border-b sticky top-0 bg-white z-10">
            <CardTitle>Student Attendance & Remarks</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {students.map((student) => (
                <div
                  key={student.id}
                  className={cn(
                    'pb-6 border-b border-slate-200 last:border-0 last:pb-0',
                    !isEditing &&
                      !student.isPresent &&
                      'bg-red-50/50 p-4 rounded-lg'
                  )}
                >
                  {isEditing ? (
                    // Edit Mode
                    <>
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
                          value={student.remarks || ''}
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
                    </>
                  ) : (
                    // View Mode
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {student.isPresent ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-base font-medium">
                          {student.name}
                          {student.rollNumber && (
                            <span className="ml-2 text-sm text-slate-500">
                              ({student.rollNumber})
                            </span>
                          )}
                        </span>
                      </div>
                      {student.remarks && (
                        <div className="pl-6 text-sm text-slate-600">
                          {student.remarks}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="sticky bottom-20 bg-slate-50 pt-4 pb-2 -mx-4 px-4 border-t border-slate-200">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            {!isEditing && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Activity
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this activity? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={handleDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-indigo-500 hover:bg-indigo-600 ml-auto"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Activity
              </Button>
            ) : (
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStudents(activity.students);
                    setIsEditing(false);
                  }}
                  className="text-slate-600 hover:bg-slate-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-indigo-500 hover:bg-indigo-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActivityDetailsPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  return <ActivityDetailsContent activityId={resolvedParams.id} />;
}
