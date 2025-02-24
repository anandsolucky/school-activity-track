'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, LogOut, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null; // The middleware will handle the redirect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="px-4 py-3 flex items-center gap-2">
          <User className="h-5 w-5 text-indigo-500" />
          <h1 className="text-lg font-medium text-slate-900">Profile</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Profile Card */}
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-900">
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture and Name */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                <span className="text-3xl font-semibold text-indigo-600">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Mail className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {user.email}
                  </p>
                  <p className="text-xs text-slate-500">Email Address</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <School className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Teacher</p>
                  <p className="text-xs text-slate-500">Account Type</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-900">Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="lg"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
