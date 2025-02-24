'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/contexts/AuthContext';
import * as XLSX from 'xlsx';

interface Student {
  name: string;
  rollNumber?: string;
}

interface ClassDetails {
  id: string;
  name: string;
  studentCount: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function AddStudentsContent({ classId }: { classId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([
    { name: '', rollNumber: '' },
  ]);
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);

  React.useEffect(() => {
    async function fetchClassDetails() {
      if (!user) return;
      try {
        const classDoc = await getDoc(doc(db, 'classes', classId));
        if (!classDoc.exists()) {
          toast.error('Class not found');
          router.back();
          return;
        }

        const data = classDoc.data();
        if (data.teacherId !== user.uid) {
          toast.error(
            'You do not have permission to add students to this class'
          );
          router.back();
          return;
        }

        setClassDetails({
          id: classDoc.id,
          name: data.name,
          studentCount: data.studentCount || 0,
        });
      } catch (err) {
        console.error('Error fetching class:', err);
        toast.error('Failed to load class details');
      }
    }

    fetchClassDetails();
  }, [classId, user, router]);

  const handleStudentChange = (
    index: number,
    field: keyof Student,
    value: string
  ) => {
    const newStudents = [...students];
    newStudents[index] = { ...newStudents[index], [field]: value };
    setStudents(newStudents);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Student>(firstSheet);

        if (jsonData.length === 0) {
          toast.error('No data found in the Excel file');
          return;
        }

        setStudents(
          jsonData.map((student) => ({
            name: student.name || '',
            rollNumber: student.rollNumber || '',
          }))
        );
        toast.success(`Loaded ${jsonData.length} students from Excel`);
      } catch (err) {
        console.error('Error parsing Excel:', err);
        toast.error('Failed to parse Excel file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classDetails) return;

    const validStudents = students.filter((s) => s.name.trim());
    if (validStudents.length === 0) {
      toast.error('Please add at least one student');
      return;
    }

    setLoading(true);
    try {
      // Add students to Firestore
      const addStudentPromises = validStudents.map((student) =>
        addDoc(collection(db, 'students'), {
          ...student,
          classId,
          createdAt: new Date().toISOString(),
        })
      );
      await Promise.all(addStudentPromises);

      // Update class student count
      await updateDoc(doc(db, 'classes', classId), {
        studentCount: classDetails.studentCount + validStudents.length,
      });

      toast.success('Students added successfully');
      router.push(`/dashboard/classes/${classId}`);
    } catch (err) {
      console.error('Error adding students:', err);
      toast.error('Failed to add students');
    } finally {
      setLoading(false);
    }
  };

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
                Add Students
              </h1>
              {classDetails && (
                <p className="text-sm text-slate-500">to {classDetails.name}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 max-w-3xl mx-auto">
        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="manual"
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
            >
              Manual Entry
            </TabsTrigger>
            <TabsTrigger
              value="excel"
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
            >
              Excel Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Add Student</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={students[0].name}
                        onChange={(e) =>
                          handleStudentChange(0, 'name', e.target.value)
                        }
                        placeholder="Student name"
                        required
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="roll">Roll Number</Label>
                      <Input
                        id="roll"
                        value={students[0].rollNumber}
                        onChange={(e) =>
                          handleStudentChange(0, 'rollNumber', e.target.value)
                        }
                        placeholder="Optional"
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-indigo-500 hover:bg-indigo-600"
                    >
                      {loading ? 'Adding Student...' : 'Add Student'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="excel">
            <Card>
              <CardHeader>
                <CardTitle>Upload Excel File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8">
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-4" />
                    <div className="text-sm text-slate-500 mb-4">
                      Upload an Excel file with columns: name, rollNumber
                      (optional)
                    </div>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="excel-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById('excel-upload')?.click()
                      }
                      className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </div>

                {students.length > 1 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-slate-900">
                        Preview ({students.length} students)
                      </h3>
                      <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-indigo-500 hover:bg-indigo-600"
                      >
                        {loading ? 'Adding Students...' : 'Add Students'}
                      </Button>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Roll Number
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {students.map((student, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                  {student.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                  {student.rollNumber || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AddStudentsPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  return <AddStudentsContent classId={resolvedParams.id} />;
}
