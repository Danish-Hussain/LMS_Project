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
  discountPercent?: number;
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
  const [successMsgById, setSuccessMsgById] = useState<Record<string, string | null>>({});
  // Lightweight filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  // Localized pricing
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [usdToInr, setUsdToInr] = useState<number | null>(null);

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

  // Detect location and setup currency
  useEffect(() => {
    const detect = async () => {
      try {
        const geoRes = await fetch('https://ipapi.co/json/');
        if (geoRes.ok) {
          const geo = await geoRes.json().catch(() => null);
          if (geo && (geo.country_code === 'IN' || geo.country === 'India')) {
            setCurrency('INR');
            try {
              const rRes = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=INR');
              if (rRes.ok) {
                const data = await rRes.json().catch(() => null);
                const r = data?.rates?.INR;
                if (typeof r === 'number' && r > 0) setUsdToInr(r);
              }
            } catch {}
          }
        }
      } catch {}
    };
    detect();
  }, []);

  const formatLocalizedPrice = (p?: number | null) => {
    if (!p || p <= 0) return 'Free';
    if (currency === 'INR') {
      const rate = usdToInr || 83;
      const inr = p * rate;
      try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(inr); } catch { return `₹${Math.round(inr).toLocaleString('en-IN')}`; }
    }
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p); } catch { return `$${p}`; }
  };

  const computePriceParts = (usd?: number | null, d?: number | null) => {
    const price = typeof usd === 'number' ? usd : null;
    const pct = typeof d === 'number' ? Math.max(0, Math.min(100, d)) : 0;
    if (!price || price <= 0) return { label: 'Free', original: null as string | null, percent: 0 };
    const label = formatLocalizedPrice(price);
    if (!pct) return { label, original: null as string | null, percent: 0 };
    const original = formatLocalizedPrice(price / (1 - pct / 100));
    return { label, original, percent: Math.round(pct) };
  };

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
      // Inline success chip near the price/actions
      setSuccessMsgById((prev) => ({ ...prev, [courseId]: !isPublished ? 'Published' : 'Unpublished' }));
      setTimeout(() => {
        setSuccessMsgById((prev) => ({ ...prev, [courseId]: null }));
      }, 2000);
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
      // Inline success chip
      setSuccessMsgById((prev) => ({ ...prev, [courseId]: 'Saved' }));
      setTimeout(() => {
        setSuccessMsgById((prev) => ({ ...prev, [courseId]: null }));
      }, 2000);
    } catch (e) {
      console.error('Update price error:', e);
      toast.error('Failed to update price');
    } finally {
      setSavingPriceId(null);
    }
  };

  // Filter by search and status (admin only for status)
  const filteredCourses = courses.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesQ = !q || c.name.toLowerCase().includes(q);
    const matchesStatus =
      !isAdmin || statusFilter === 'all'
        ? true
        : statusFilter === 'published'
        ? c.isPublished
        : !c.isPublished;
    return matchesQ && matchesStatus;
  });

  // Helper: check if a course's price is edited and different (within 2 decimals)
  const isPriceDirty = (courseId: string) => {
    const edit = priceEdits[courseId];
    if (edit === undefined) return false;
    const current = courses.find((c) => c.id === courseId)?.price ?? 0;
    const nextVal = Number(edit);
    if (!Number.isFinite(nextVal)) return false;
    const roundedCurrent = Math.round(current * 100) / 100;
    const roundedNext = Math.round(nextVal * 100) / 100;
    return roundedCurrent !== roundedNext;
  };

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

          {/* Simple filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses…"
              className="w-full md:w-80 px-3 py-2 rounded-md border text-sm"
              style={{ borderColor: 'var(--section-border)', background: 'var(--background)', color: 'var(--foreground)' }}
              aria-label="Search on-demand courses"
            />
            {isAdmin && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full md:w-48 px-3 py-2 rounded-md border text-sm"
                style={{ borderColor: 'var(--section-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            )}
          </div>
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
                className="rounded-xl shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}
                title={`Created ${new Date(course.createdAt).toLocaleDateString()}`}
              >
                {/* Course Header */}
                <div className="p-5 border-b" style={{ borderColor: 'var(--section-border)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center min-w-0">
                      <div className="p-2 rounded-lg mr-3" style={{ background: 'rgba(37, 99, 235, 0.08)' }}>
                        <Video className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-base md:text-lg font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                        {course.name}
                      </h3>
                    </div>
                    {isAdmin && (
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] md:text-xs font-semibold shrink-0"
                        style={{
                          background: course.isPublished ? 'rgba(16, 185, 129, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                          color: course.isPublished ? '#059669' : '#a16207'
                        }}
                      >
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    )}
                  </div>
                  {course.description && (
                    <p className="mt-1.5 text-sm line-clamp-2" style={{ color: 'var(--session-subtext)' }}>
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Course Body */}
                <div className="p-6">
                  {/* Price */}
                  <div className="mb-4">
                    {isAdmin ? (
                      <div className="flex items-end justify-between gap-3">
                        <div className="group">
                          <label className="block text-xs mb-1" style={{ color: 'var(--session-subtext)' }}>Price (USD)</label>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-2 top-2 text-gray-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              inputMode="decimal"
                              value={priceEdits[course.id] ?? String(course.price)}
                              onChange={(e) => handlePriceChange(course.id, e.target.value)}
                              className="w-36 pl-6 pr-3 py-2 border rounded-md text-sm"
                              style={{ borderColor: 'var(--section-border)', background: 'var(--background)', color: 'var(--foreground)' }}
                              aria-label="Course price"
                            />
                          </div>
                          {/* Localized preview for admins (student view) */}
                          {(() => {
                            const parts = computePriceParts(
                              Number(priceEdits[course.id] ?? course.price) || 0,
                              course.discountPercent ?? 0
                            );
                            return (
                              <div className="mt-1 text-[11px] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" style={{ color: 'var(--session-subtext)' }}>
                                Student view: <span className="font-medium" style={{ color: 'var(--foreground)' }}>{parts.label}</span>
                                {parts.original && (
                                  <>
                                    {' '}
                                    <span className="line-through text-gray-500">{parts.original}</span>
                                    {' '}
                                    <span className="text-green-700">{parts.percent}% off</span>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                          {successMsgById[course.id] && (
                            <div className="mt-1 text-[11px] font-medium" style={{ color: '#059669' }}>
                              ✓ {successMsgById[course.id]}
                            </div>
                          )}
                        </div>
                        {isPriceDirty(course.id) && (
                          <button
                            onClick={() => handleUpdatePrice(course.id)}
                            disabled={savingPriceId === course.id}
                            className="px-3 py-2 rounded-md text-sm font-medium text-white"
                            style={{ background: '#16a34a', opacity: savingPriceId === course.id ? 0.8 : 1 }}
                          >
                            {savingPriceId === course.id ? 'Saving…' : 'Update'}
                          </button>
                        )}
                      </div>
                    ) : (
                      (() => {
                        const parts = computePriceParts(course.price ?? 0, course.discountPercent ?? 0);
                        return (
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>{parts.label}</span>
                            {parts.original && (
                              <>
                                <span className="text-gray-500 line-through text-base">{parts.original}</span>
                                <span className="text-green-700 text-sm font-semibold">{parts.percent}% off</span>
                              </>
                            )}
                          </div>
                        );
                      })()
                    )}
                    {/* Created date moved to card tooltip (title) to reduce on-card text */}
                  </div>

                  {/* Removed 'Part of' base course reference as requested */}

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2">
                    {isAdmin ? (
                      <>
                        {/* Desktop actions */}
                        <div className="hidden md:flex items-center justify-between gap-2 w-full">
                          <Link
                            href={`/recorded-courses/${course.id}/edit`}
                            className="px-3 py-2 rounded-md text-sm font-medium text-white"
                            style={{ background: '#2563eb' }}
                          >
                            <span className="inline-flex items-center gap-2"><Edit2 className="w-4 h-4" /> Edit</span>
                          </Link>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleTogglePublish(course.id, course.isPublished)}
                              className="p-2 rounded-md border"
                              style={{ borderColor: 'var(--section-border)', color: 'var(--foreground)', background: 'transparent' }}
                              title={course.isPublished ? 'Unpublish' : 'Publish'}
                            >
                              {course.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(course.id)}
                              className="p-2 rounded-md border text-red-500"
                              style={{ borderColor: 'var(--section-border)', background: 'transparent' }}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {/* Mobile actions in a simple dropdown */}
                        <details className="md:hidden relative w-full">
                          <summary className="list-none px-3 py-2 border rounded-md text-sm cursor-pointer" style={{ borderColor: 'var(--section-border)', color: 'var(--foreground)', background: 'transparent' }}>
                            More
                          </summary>
                          <div className="absolute right-0 mt-2 w-40 rounded-md border shadow-sm z-10" style={{ background: 'var(--section-bg)', borderColor: 'var(--section-border)' }}>
                            <Link
                              href={`/recorded-courses/${course.id}/edit`}
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-black/5"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleTogglePublish(course.id, course.isPublished)}
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-black/5"
                            >
                              {course.isPublished ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(course.id)}
                              className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-black/5"
                            >
                              Delete
                            </button>
                          </div>
                        </details>
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
