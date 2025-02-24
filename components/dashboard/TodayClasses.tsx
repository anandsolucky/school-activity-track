'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ChevronRight } from 'lucide-react';

// TODO: Replace with actual data from Firebase
const mockClasses = [
  { id: '1', name: 'Class 10A', studentCount: 35 },
  { id: '2', name: 'Class 11B', studentCount: 42 },
  { id: '3', name: 'Class 12C', studentCount: 38 },
];

export default function TodayClasses() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {mockClasses.map((classItem) => (
        <Card
          key={classItem.id}
          className="hover:bg-slate-50 border-slate-200 transition-colors cursor-pointer group"
          onClick={() => router.push(`/class/${classItem.id}`)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold text-slate-900">
              {classItem.name}
            </CardTitle>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-slate-600">
              <Users className="mr-2 h-4 w-4" />
              {classItem.studentCount} students
            </div>
          </CardContent>
        </Card>
      ))}

      {mockClasses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">
            No classes scheduled for today
          </p>
        </div>
      )}
    </div>
  );
}
