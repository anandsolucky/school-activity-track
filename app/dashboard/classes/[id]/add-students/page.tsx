'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/contexts/AuthContext';
import * as XLSX from 'xlsx';

interface Student {
  name: string;
  rollNumber?: string;
  email?: string;
}

export default function AddStudentsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Student name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Verify class exists and belongs to the teacher
      const classDoc = await getDoc(doc(db, 'classes', params.id));
      if (!classDoc.exists() || classDoc.data()?.teacherId !== user?.uid) {
        setError('Invalid class or permission denied');
        return;
      }

      // Add student to Firestore
      const studentData = {
        name: name.trim(),
        rollNumber: rollNumber.trim() || null,
        email: email.trim() || null,
        classId: params.id,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'students'), studentData);

      // Update class student count
      const currentCount = classDoc.data()?.studentCount || 0;
      await updateDoc(doc(db, 'classes', params.id), {
        studentCount: currentCount + 1,
      });

      // Clear form
      setName('');
      setRollNumber('');
      setEmail('');

      // Show success message or redirect
      router.refresh(); // Refresh the page to show the new student
    } catch (err) {
      console.error('Error adding student:', err);
      setError('Failed to add student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setUploadError('');

      // Verify class exists and belongs to the teacher
      const classDoc = await getDoc(doc(db, 'classes', params.id));
      if (!classDoc.exists() || classDoc.data()?.teacherId !== user?.uid) {
        setUploadError('Invalid class or permission denied');
        return;
      }

      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Student>(worksheet);

      if (jsonData.length === 0) {
        setUploadError('No students found in the Excel file');
        return;
      }

      // Add students to Firestore
      for (const student of jsonData) {
        if (!student.name) continue;

        await addDoc(collection(db, 'students'), {
          name: student.name.trim(),
          rollNumber: student.rollNumber?.toString().trim() || null,
          email: student.email?.trim() || null,
          classId: params.id,
          createdAt: new Date().toISOString(),
        });
      }

      // Update class student count
      const currentCount = classDoc.data()?.studentCount || 0;
      await updateDoc(doc(db, 'classes', params.id), {
        studentCount: currentCount + jsonData.length,
      });

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      router.refresh(); // Refresh the page to show the new students
    } catch (err) {
      console.error('Error uploading students:', err);
      setUploadError(
        'Failed to upload students. Please check your Excel file format.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Add Students
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link
            href={`/dashboard/classes/${params.id}`}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Back to Class
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Manual Entry Form */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Add Student Manually
            </h3>
            <form onSubmit={handleManualAdd} className="mt-5 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="roll-number"
                  className="block text-sm font-medium text-gray-700"
                >
                  Roll Number (Optional)
                </label>
                <input
                  type="text"
                  name="roll-number"
                  id="roll-number"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Student'}
              </button>
            </form>
          </div>
        </div>

        {/* Excel Upload */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Upload Excel File
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Upload an Excel file with student details.</p>
              <p className="mt-1">
                Required columns: Name
                <br />
                Optional columns: Roll Number, Email
              </p>
            </div>
            {uploadError && (
              <div className="mt-4 bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {uploadError}
              </div>
            )}
            <div className="mt-5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={loading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
