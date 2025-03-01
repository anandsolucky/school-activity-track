'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Only redirect once the auth state is determined and we haven't started redirecting
    if (!loading && !redirecting) {
      setRedirecting(true);
      const destination = user ? '/dashboard' : '/login';
      console.log(
        `Root page redirecting to: ${destination}, User auth state: ${!!user}`
      );

      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        router.replace(destination);
      }, 100);
    }
  }, [user, loading, router, redirecting]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-500 text-sm">Loading...</p>
    </div>
  );
}
