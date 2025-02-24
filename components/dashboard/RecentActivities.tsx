'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronRight } from 'lucide-react';

// TODO: Replace with actual data from Firebase
const mockActivities = [
  {
    id: '1',
    date: '2024-02-24',
    className: 'Class 10A',
    topic: 'Introduction to Algebra',
  },
  {
    id: '2',
    date: '2024-02-23',
    className: 'Class 11B',
    topic: 'Chemical Bonding',
  },
  {
    id: '3',
    date: '2024-02-23',
    className: 'Class 12C',
    topic: 'Electromagnetic Waves',
  },
];

export default function RecentActivities() {
  const router = useRouter();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {mockActivities.map((activity) => (
        <Card
          key={activity.id}
          className="hover:bg-slate-50 cursor-pointer border-slate-200 transition-colors"
          onClick={() => router.push(`/activity/${activity.id}`)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold text-slate-900">
              {activity.className}
            </CardTitle>
            <div className="flex items-center text-sm text-slate-600">
              <CalendarDays className="mr-2 h-4 w-4" />
              {formatDate(activity.date)}
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-indigo-600">{activity.topic}</p>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </CardContent>
        </Card>
      ))}

      {mockActivities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No recent activities</p>
        </div>
      )}

      {mockActivities.length > 0 && (
        <Button
          variant="outline"
          className="w-full border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          onClick={() => router.push('/activities')}
        >
          View All Activities
        </Button>
      )}
    </div>
  );
}
