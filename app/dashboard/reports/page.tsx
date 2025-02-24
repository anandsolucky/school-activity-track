'use client';

import React from 'react';
import { BarChart3, LineChart, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="px-4 py-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          <h1 className="text-lg font-medium text-slate-900">Reports</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 max-w-2xl mx-auto">
        <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-100 to-indigo-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/40" />
          <CardContent className="p-8 relative">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center backdrop-blur-sm">
                <LineChart className="h-8 w-8 text-indigo-600" />
              </div>

              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold mb-2 text-slate-900">
                  Analytics Coming Soon
                </h2>
                <p className="text-slate-600 max-w-md">
                  Powerful insights to help you monitor attendance and track
                  student performance at a glance.
                </p>
              </div>

              {/* Features Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-left shadow-sm">
                  <h3 className="font-medium mb-2 text-slate-900">
                    Attendance Insights
                  </h3>
                  <p className="text-sm text-slate-600">
                    Visual patterns and trends to spot attendance issues early.
                  </p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 text-left shadow-sm">
                  <h3 className="font-medium mb-2 text-slate-900">
                    Performance Analytics
                  </h3>
                  <p className="text-sm text-slate-600">
                    Quick metrics on class engagement and participation.
                  </p>
                </div>
              </div>

              {/* Coming Soon Badge */}
              <div className="flex items-center gap-2 bg-indigo-500/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Clock className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">
                  Coming Soon
                </span>
              </div>

              {/* Notification Button */}
              <Button
                className="bg-indigo-600 text-white hover:bg-indigo-700 transition-colors mt-4"
                size="lg"
              >
                Get Notified When Live
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
