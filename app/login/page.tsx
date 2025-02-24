import React from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { School } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Logo and Title Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <School className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            School Activity Track
          </h1>
          <p className="text-sm text-gray-500 text-center">
            Manage your classes and track student activities efficiently
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
