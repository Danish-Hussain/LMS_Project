'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  Plus,
  Video,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface RecordedCourse {
  id: string;
  name: string;
  description: string;
  price: number;
  isPublished: boolean;
  createdAt: string;
  course?: {
    id: string;
    title: string;
  };
}

export default function OnDemandCoursesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [courses, setCourses] = useState<RecordedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR';

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const url = isAdmin
        ? '/api/recorded-courses'
        : '/api/recorded-courses?published=true';

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch courses');

      const data = await response.json();
      setCourses(Array.isArray(data) ? data : data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (courseId: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/recorded-courses/${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete course');

      setCourses(courses.filter((c) => c.id !== courseId));
      toast.success('Course deleted successfully');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async (courseId: string, isPublished: boolean) => {
    try {
      const response = await fetch(`/api/recorded-courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished }),
      });

      if (!response.ok) throw new Error('Failed to update course');

      setCourses(
        courses.map((c) =>
          c.id === courseId ? { ...c, isPublished: !isPublished } : c
        )
      );
      toast.success(
        `Course ${!isPublished ? 'published' : 'unpublished'} successfully`
      );
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    }
  };

  const handlePriceChange = (courseId: string, value: string) => {
    // Avoid leading zeros and ensure numeric string
    setPriceEdits((prev) => ({ ...prev, [courseId]: value }));
  };

  const handleUpdatePrice = async (courseId: string) => {
    const edit = priceEdits[courseId];
    const current = courses.find((c) => c.id === courseId)?.price ?? 0;
    const nextVal = edit !== undefined ? Number(edit) : current;
    if (!Number.isFinite(nextVal) || nextVal < 0) {
      toast.error('Please enter a valid non-negative price');
      return;
    }
    // Avoid unnecessary call if unchanged within 2 decimals
    const roundedCurrent = Math.round(current * 100) / 100;
    const roundedNext = Math.round(nextVal * 100) / 100;
    if (roundedCurrent === roundedNext) {
      toast.success('Price unchanged');
      return;
    }
    try {
      setSavingPriceId(courseId);
      const res = await fetch(`/api/recorded-courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: roundedNext }),
      });
      if (!res.ok) throw new Error('Failed to update price');
      setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, price: roundedNext } : c)));
      setPriceEdits((prev) => ({ ...prev, [courseId]: String(roundedNext) }));
      toast.success('Price updated');
    } catch (e) {
      console.error('Update price error:', e);
      toast.error('Failed to update price');
    } finally {
      setSavingPriceId(null);
    }
  };

  // No filtering or sorting — show all courses as-is
  const filteredCourses = courses;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                On-Demand Courses
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--session-subtext)' }}>
                {isAdmin ? 'Manage your pre-recorded courses' : 'Explore self-paced learning'}
              </p>
            </div>
            {isAdmin && (
              <Link
                href="/recorded-courses/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Course
              </Link>
            )}
          </div>

          {/* Removed stats and filters as requested */}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-8 h-8 text-purple-500 animate-spin mb-3" />
            <p className="text-gray-400">Loading courses...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {isAdmin ? 'No courses yet' : 'No courses available'}
            </h3>
            <p className="text-gray-400 mb-6">
              {isAdmin
                ? 'Create your first on-demand course to get started.'
                : 'Check back soon for new courses.'}
            </p>
            {isAdmin && (
              <Link
                href="/recorded-courses/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Create First Course
              </Link>
            )}
          </div>
        )}

        {/* Courses Grid */}
        {!loading && filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="rounded-lg shadow-sm overflow-hidden transition-shadow"
                style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}
              >
                {/* Course Header */}
                <div className="p-6 border-b" style={{ borderColor: 'var(--section-border)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg mr-3" style={{ background: 'rgba(37, 99, 235, 0.1)' }}>
                        <Video className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                        {course.name}
                      </h3>
                    </div>
                    {isAdmin && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: course.isPublished ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: course.isPublished ? '#059669' : '#a16207'
                        }}
                      >
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm line-clamp-2" style={{ color: 'var(--session-subtext)' }}>
                    {course.description}
                  </p>
                </div>

                {/* Course Body */}
                <div className="p-6">
                  {/* Price */}
                  <div className="mb-4">
                    {isAdmin ? (
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <span className="absolute left-2 top-2 text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                            value={priceEdits[course.id] ?? String(course.price)}
                            onChange={(e) => handlePriceChange(course.id, e.target.value)}
                            className="w-32 pl-6 pr-3 py-2 border rounded-md"
                            style={{ borderColor: 'var(--section-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                            aria-label="Course price"
                          />
                        </div>
                        <button
                          onClick={() => handleUpdatePrice(course.id)}
                          disabled={savingPriceId === course.id}
                          className="px-3 py-2 rounded-md text-sm font-medium text-white"
                          style={{ background: '#16a34a', opacity: savingPriceId === course.id ? 0.8 : 1 }}
                        >
                          {savingPriceId === course.id ? 'Saving…' : 'Update'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                        ${course.price.toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: 'var(--session-subtext)' }}>
                      Created {new Date(course.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Removed 'Part of' base course reference as requested */}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {isAdmin ? (
                      <>
                        <button
                          onClick={() =>
                            handleTogglePublish(course.id, course.isPublished)
                          }
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors text-sm font-medium"
                          style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}
                          title={
                            course.isPublished ? 'Unpublish' : 'Publish'
                          }
                        >
                          {course.isPublished ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Show
                            </>
                          )}
                        </button>

                        <Link
                          href={`/recorded-courses/${course.id}/edit`}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors text-sm font-medium"
                          style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Link>

                        <button
                          onClick={() => setDeleteConfirm(course.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors text-sm font-medium"
                          style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    ) : (
                      <Link
                        href={`/on-demand-courses/${course.id}`}
                        className="w-full px-4 py-2 text-white rounded hover:shadow transition-all text-center font-medium"
                        style={{ background: '#2563eb' }}
                      >
                        View Course
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Delete Course"
        message="Are you sure you want to delete this course? This action cannot be undone."
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
