'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { format } from 'date-fns';

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
    } catch (err) {
      console.error('Error updating activity:', err);
      toast.error('Failed to update activity');
    } finally {
      setSaving(false);
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
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance & Remarks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="pb-4 border-b border-slate-200 last:border-0 last:pb-0"
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ActivityDetailsPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  return <ActivityDetailsContent activityId={resolvedParams.id} />;
}
