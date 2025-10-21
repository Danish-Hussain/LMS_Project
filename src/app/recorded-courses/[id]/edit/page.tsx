'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Loader,
  BookOpen,
  PlayCircle,
  BadgeCheck,
} from 'lucide-react';

interface Session {
  id: string;
  title: string;
  videoUrl: string;
  order: number;
  isPreview?: boolean;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order: number;
  sessions: Session[];
}

interface RecordedCourse {
  id: string;
  name: string;
  description?: string;
  price: number;
  isPublished: boolean;
  courseId: string;
}

export default function EditRecordedCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const recordedCourseId = params.id as string;

  const [course, setCourse] = useState<RecordedCourse | null>(null);
  const [courseId, setCourseId] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewInFlight, setPreviewInFlight] = useState<Set<string>>(new Set());
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

  // New section form state
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);

  // New session form state
  const [newSessionData, setNewSessionData] = useState({
    sectionId: '',
    title: '',
    videoUrl: '',
    isPreview: false,
  });
  const [showNewSessionForm, setShowNewSessionForm] = useState<string | null>(null);

  // Edit modes
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingSectionData, setEditingSectionData] = useState({ title: '', description: '' });

  const fetchCourseAndSections = async () => {
    try {
      setLoading(true);
      // Fetch recorded course
      const courseRes = await fetch(`/api/recorded-courses/${recordedCourseId}`);
      if (!courseRes.ok) throw new Error('Failed to fetch course');
      const courseData = await courseRes.json();
      setCourse(courseData);
      setCourseId(courseData.courseId);

      // Fetch sections using the actual courseId from the recorded course
      const sectionsRes = await fetch(`/api/recorded-courses/${courseData.courseId}/sections`);
      if (!sectionsRes.ok) throw new Error('Failed to fetch sections');
      const sectionsData = await sectionsRes.json();
      setSections(Array.isArray(sectionsData) ? sectionsData : sectionsData.sections || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load course');
      router.push('/on-demand-courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      router.push('/on-demand-courses');
      return;
    }
    fetchCourseAndSections();
  }, [recordedCourseId, user, router]);

  // Add new section
  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) {
      toast.error('Section title is required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/recorded-courses/${courseId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSectionTitle,
          order: sections.length + 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      const newSection = await response.json();

      setSections([...sections, newSection]);
      setNewSectionTitle('');
      setShowNewSectionForm(false);
      toast.success('Section created successfully');
    } catch (error) {
      console.error('Error adding section:', error);
      toast.error('Failed to create section');
    } finally {
      setSaving(false);
    }
  };

  // Add new session to section
  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionData.title.trim() || !newSessionData.videoUrl.trim()) {
      toast.error('Title and video URL are required');
      return;
    }

    try {
      setSaving(true);
      const section = sections.find((s) => s.id === newSessionData.sectionId);
      const sessionOrder = (section?.sessions?.length || 0) + 1;

      const response = await fetch(
        `/api/recorded-courses/${courseId}/sections/${newSessionData.sectionId}/sessions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newSessionData.title,
            videoUrl: newSessionData.videoUrl,
            order: sessionOrder,
            isPreview: !!newSessionData.isPreview,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to create session');
      const newSession = await response.json();

      setSections(
        sections.map((s) =>
          s.id === newSessionData.sectionId
            ? { ...s, sessions: [...(s.sessions || []), newSession] }
            : s
        )
      );

  setNewSessionData({ sectionId: '', title: '', videoUrl: '', isPreview: false });
      setShowNewSessionForm(null);
      toast.success('Session created successfully');
    } catch (error) {
      console.error('Error adding session:', error);
      toast.error('Failed to create session');
    } finally {
      setSaving(false);
    }
  };

  // Delete section
  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      setSaving(true);
      const response = await fetch(
        `/api/recorded-courses/${courseId}/sections/${sectionId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete section');
      setSections(sections.filter((s) => s.id !== sectionId));
      toast.success('Section deleted successfully');
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    } finally {
      setSaving(false);
    }
  };

  // Delete session
  const handleDeleteSession = async (sectionId: string, sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      setSaving(true);
      const response = await fetch(
        `/api/recorded-courses/${courseId}/sections/${sectionId}/sessions/${sessionId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete session');
      setSections(
        sections.map((s) =>
          s.id === sectionId
            ? { ...s, sessions: s.sessions.filter((sess) => sess.id !== sessionId) }
            : s
        )
      );
      toast.success('Session deleted successfully');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    } finally {
      setSaving(false);
    }
  };

  // Toggle preview flag on a session
  const handleTogglePreview = async (
    sectionId: string,
    sessionId: string,
    current: boolean
  ) => {
    try {
      setPreviewInFlight((prev) => new Set(prev).add(sessionId));
      const response = await fetch(
        `/api/recorded-courses/${courseId}/sections/${sectionId}/sessions/${sessionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPreview: !current }),
        }
      );

      if (!response.ok) throw new Error('Failed to update preview flag');
      const updated = (await response.json()) as { id: string; isPreview?: boolean };

      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                sessions: s.sessions.map((sess) =>
                  sess.id === sessionId ? { ...sess, isPreview: !!updated.isPreview } : sess
                ),
              }
            : s
        )
      );
      toast.success(updated.isPreview ? 'Session marked as preview' : 'Preview removed');
    } catch (error) {
      console.error('Error toggling preview:', error);
      toast.error('Failed to update preview');
    } finally {
      setPreviewInFlight((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/50 flex items-center justify-center">
        <p className="text-gray-400">Course not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-purple-400 hover:text-purple-300 mb-4 flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-4xl font-bold text-foreground mb-2">{course.name}</h1>
          <p className="text-gray-400">{course.description}</p>
        </div>

        {/* Sections Container */}
        <div className="space-y-4 mb-8">
          {sections.length === 0 ? (
            <div className="text-center p-8 bg-background border border-gray-300 rounded-lg">
              <BookOpen className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">No sections yet</p>
              <button
                onClick={() => setShowNewSectionForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create First Section
              </button>
            </div>
          ) : (
            sections.map((section) => (
              <div
                key={section.id}
                className="bg-background border border-gray-300 rounded-lg overflow-hidden"
              >
                {/* Section Header */}
                <div className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b border-gray-300 flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-blue-500/30 transition-colors"
                  onClick={() =>
                    setExpandedSectionId(
                      expandedSectionId === section.id ? null : section.id
                    )
                  }
                >
                  <div className="flex items-center gap-3 flex-1">
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedSectionId === section.id ? 'rotate-180' : ''
                      }`}
                    />
                    <div>
                      <h3 className="font-semibold text-foreground">{section.title}</h3>
                      <p className="text-xs text-gray-500">
                        {section.sessions?.length || 0} sessions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSection(section.id);
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Section Content */}
                {expandedSectionId === section.id && (
                  <div className="p-4 space-y-4">
                    {/* Sessions List */}
                    {section.sessions && section.sessions.length > 0 && (
                      <div className="space-y-2">
                        {section.sessions
                          .sort((a, b) => a.order - b.order)
                          .map((session) => (
                            <div
                              key={session.id}
                              className="p-3 bg-background border border-gray-300 rounded flex items-center justify-between hover:border-purple-500 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <PlayCircle className="w-5 h-5 text-purple-400" />
                                <div className="flex-1">
                                  <p className="font-medium text-foreground text-sm">
                                    {session.order}. {session.title}
                                    {session.isPreview ? (
                                      <span className="ml-2 align-middle inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                        Preview
                                      </span>
                                    ) : null}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {session.videoUrl}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!previewInFlight.has(session.id)) {
                                      handleTogglePreview(section.id, session.id, !!session.isPreview);
                                    }
                                  }}
                                  title={session.isPreview ? 'Remove preview' : 'Mark as preview'}
                                  className={`p-2 rounded transition-colors ${
                                    session.isPreview
                                      ? 'text-blue-600 hover:bg-blue-500/20'
                                      : 'text-gray-400 hover:bg-gray-500/20'
                                  }`}
                                  disabled={previewInFlight.has(session.id)}
                                >
                                  {previewInFlight.has(session.id) ? (
                                    <span className="inline-block w-4 h-4 border-2 border-gray-300 rounded-full animate-spin" />
                                  ) : (
                                    <BadgeCheck className="w-4 h-4" />
                                  )}
                                </button>

                                <button
                                  onClick={() =>
                                    handleDeleteSession(section.id, session.id)
                                  }
                                  className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Add Session Form */}
                    {showNewSessionForm === section.id ? (
                      <form onSubmit={handleAddSession} className="p-4 bg-purple-500/10 border border-purple-500/30 rounded space-y-3">
                        <input
                          type="text"
                          placeholder="Session title"
                          value={newSessionData.title}
                          onChange={(e) =>
                            setNewSessionData({
                              ...newSessionData,
                              title: e.target.value,
                              sectionId: section.id,
                            })
                          }
                          className="w-full px-3 py-2 bg-background border border-gray-300 rounded text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />

                        <input
                          type="url"
                          placeholder="Video URL (e.g., https://vimeo.com/...)"
                          value={newSessionData.videoUrl}
                          onChange={(e) =>
                            setNewSessionData({
                              ...newSessionData,
                              videoUrl: e.target.value,
                              sectionId: section.id,
                            })
                          }
                          className="w-full px-3 py-2 bg-background border border-gray-300 rounded text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />

                        <label className="flex items-center gap-2 text-sm text-foreground/80">
                          <input
                            type="checkbox"
                            checked={newSessionData.isPreview}
                            onChange={(e) =>
                              setNewSessionData({ ...newSessionData, isPreview: e.target.checked, sectionId: section.id })
                            }
                          />
                          Make this session a free preview
                        </label>

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Add Session'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewSessionForm(null);
                              setNewSessionData({ sectionId: '', title: '', videoUrl: '', isPreview: false });
                            }}
                            className="flex-1 px-3 py-2 bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition-colors text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowNewSessionForm(section.id)}
                        className="w-full px-3 py-2 border border-dashed border-gray-400 rounded text-gray-400 hover:text-gray-300 hover:border-gray-300 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Session
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Section Form */}
        {showNewSectionForm ? (
          <form
            onSubmit={handleAddSection}
            className="p-6 bg-purple-500/10 border border-purple-500/30 rounded-lg space-y-4 mb-8"
          >
            <h3 className="font-semibold text-foreground">Add New Section</h3>

            <input
              type="text"
              placeholder="Section title"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-gray-300 rounded-lg text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {saving ? 'Creating...' : 'Create Section'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewSectionForm(false);
                  setNewSectionTitle('');
                }}
                className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowNewSectionForm(true)}
            className="w-full px-4 py-3 border border-dashed border-purple-500 rounded-lg text-purple-400 hover:text-purple-300 hover:border-purple-400 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Section
          </button>
        )}
      </div>
    </div>
  );
}
