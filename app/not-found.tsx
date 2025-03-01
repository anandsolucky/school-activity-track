'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden p-6 text-center">
        <div className="mb-6 flex justify-center">
          <Image
            src="/apollo__logo.png"
            alt="Apollo International School"
            width={100}
            height={100}
            className="rounded-full bg-primary/10 p-2"
          />
        </div>

        <div className="flex justify-center mb-6">
          <Construction className="h-16 w-16 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Page Under Construction
        </h1>

        <p className="text-slate-600 mb-6">
          We&apos;re working hard to bring you this feature soon. Please check
          back later!
        </p>

        <Button asChild className="w-full">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
