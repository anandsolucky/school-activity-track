'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import {
  Home,
  GraduationCap,
  BookOpen,
  User,
  Bell,
  Calendar,
} from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Classes', href: '/dashboard/classes', icon: GraduationCap },
  { name: 'Activities', href: '/dashboard/activities', icon: BookOpen },
  { name: 'Calendar', href: '/dashboard/reports', icon: Calendar },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null; // The middleware will handle the redirect
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header with Apollo branding */}
      {pathname === '/dashboard' && (
        <header className="bg-primary text-white p-4 relative shadow-md">
          <div className="flex items-center gap-3">
            <Image
              src="/apollo__logo.png"
              alt="Apollo International School"
              width={40}
              height={40}
              className="rounded-full bg-white p-1"
            />
            <div>
              <h1 className="text-xl font-bold">Apollo International School</h1>
              <p className="text-xs opacity-90">2024-2025</p>
            </div>
            <Link href="/dashboard/notifications" className="ml-auto">
              <Bell className="h-6 w-6 text-white" />
              <span className="absolute top-3 right-4 bg-secondary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </Link>
          </div>
        </header>
      )}

      <main>{children}</main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
          {navigation.map((item) => {
            // Special handling for home route to prevent it being active on subpages
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                } flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-lg transition-all`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
