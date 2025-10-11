'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState, use } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { ArrowLeft, Plus, Edit, Trash2, FolderPlus, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react'
import useToast from '@/hooks/useToast'
import { SectionForm } from '@/components/sections/SectionForm'

interface Session {
  id: string
  title: string
  description: string | null
  videoUrl: string
  duration: number | null
  order: number
  isPublished: boolean
  sectionId: string | null
}

interface BatchDetails {
  id: string
  courseId: string
  title: string
  course: {
    id: string
    title: string
    description: string | null
  }
  sections: {
    id: string
    title: string
    order: number
    description: string | null
  }[]
}

interface Section {
  id: string
  title: string
  order: number
  description?: string | null
}

export default function BatchSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading } = useAuth()
  const resolvedParams = use(params)
  const batchId = resolvedParams.id
  const router = useRouter()
  
  const [sessions, setSessions] = useState<Session[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [batchData, setBatchData] = useState<BatchDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSectionForm, setShowSectionForm] = useState(false)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [confirmDeleteSectionId, setConfirmDeleteSectionId] = useState<string | null>(null)
  const [confirmDeleteSessionId, setConfirmDeleteSessionId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { info: toastInfo, error: toastError, success: toastSuccess } = useToast()

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch batch details (browser will send httpOnly cookie automatically)
      const batchResponse = await fetch(`/api/batches/${batchId}`, { credentials: 'same-origin' })

      if (!batchResponse.ok) {
        if (batchResponse.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch batch details')
      }

      const batchDetails = await batchResponse.json()
      setBatchData(batchDetails)
      setSections(batchDetails.sections || [])

      // Fetch sessions (cookie will be sent automatically)
      const sessionsResponse = await fetch(`/api/batches/${batchId}/sessions`, { credentials: 'same-origin' })
      if (!sessionsResponse.ok) {
        const text = await sessionsResponse.text().catch(() => '')
        console.error('Sessions fetch failed:', sessionsResponse.status, text)
        if (sessionsResponse.status === 401) {
          // Not authenticated
          setAuthError('Your session is not valid. Please sign in again.')
          return
        }
        setError(`Failed to fetch sessions: ${sessionsResponse.status} ${text}`)
        return
      }
      const sessionsData = await sessionsResponse.json()
      setSessions(sessionsData)
    } catch (error) {
      setError('Error loading data')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSectionSuccess = () => {
    setShowSectionForm(false)
    setSelectedSection(null)
    fetchData()
  }

  const doDeleteSection = async (sectionId: string) => {
    try {
      const response = await fetch(`/api/batches/${batchId}/sections/${sectionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete section')
      
      fetchData()
    } catch (error) {
      setError('Error deleting section')
      console.error(error)
    }
  }

  const doDeleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE', credentials: 'same-origin' })
      if (!res.ok) throw new Error('Failed to delete session')
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      setSuccessMessage('Session deleted')
      setTimeout(() => setSuccessMessage(null), 2500)
    } catch (e) {
      console.error(e)
      setError('Error deleting session')
    }
  }

  const handleTogglePublish = async (sessionId: string, publish: boolean) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: publish })
      })
      if (!res.ok) throw new Error('Failed to update')
      // refresh sessions
      fetchData()
    } catch (e) {
      console.error(e)
      setError('Error updating session')
    }
  }

  const handleMoveSession = async (sessionId: string, direction: 'up' | 'down') => {
    try {
      const target = sessions.find(s => s.id === sessionId)
      if (!target) return
      const newOrder = direction === 'up' ? Math.max(1, target.order - 1) : target.order + 1
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      })
      if (!res.ok) throw new Error('Failed to move')
      await fetchData()
    } catch (e) {
      console.error(e)
      setError('Error moving session')
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      // Instead of an immediate redirect, surface a helpful message so we can
      // diagnose cookie/auth problems in the browser. The user can click to go
      // to login manually.
      setAuthError('You are not authenticated. Click below to sign in.')
      return
    }

    if (!loading && user) {
      fetchData()
      // If redirected after creating a session, expand & highlight it
      const createdSessionId = searchParams?.get('createdSessionId')
      const createdSectionId = searchParams?.get('sectionId')
      if (createdSectionId) {
        setExpandedSections(prev => new Set(prev).add(createdSectionId))
      }
      if (createdSessionId) {
        setActiveSessionId(createdSessionId)
        setSuccessMessage('Session created')
        // after a short timeout, scroll into view
        setTimeout(() => {
          const el = document.querySelector(`[data-session-id="${createdSessionId}"]`)
          if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 300)
        // clear the query params so refresh doesn't re-highlight
        setTimeout(() => {
          router.replace(`/batches/${batchId}/sessions`)
        }, 500)
        // hide success after a few seconds
        setTimeout(() => setSuccessMessage(null), 3500)
      }
    }
  }, [loading, user, batchId])

  if (loading || isLoading) {
    return <div className="manage-sessions">Loading...</div>
  }

  if (!batchData) {
    return <div className="manage-sessions">Batch not found</div>
  }

  return (
    <div className="manage-sessions">
      <div className="manage-header">
        <div>
          <Link href="/batches" className="flex items-center text-gray-600 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Batches
          </Link>
          <h1 className="manage-title">Manage Sessions</h1>
          <p className="text-gray-600 mt-2">
            Organize and manage video sessions for this batch
          </p>
        </div>
        <div className="manage-actions">
          <button
            onClick={() => {
              setSelectedSection(null)
              setShowSectionForm(true)
            }}
            className="btn btn-success"
          >
            <FolderPlus className="w-4 h-4" />
            Add Section
          </button>
          <Link href={`/batches/${batchId}/sessions/new`} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Session
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {authError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          <div className="flex items-center justify-between">
            <div>
              <strong className="block">{authError}</strong>
              <p className="text-sm text-yellow-700">It looks like your session cookie is missing or invalid.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn btn-primary">Sign in</Link>
              <button
                onClick={async () => {
                    try {
                    const r = await fetch('/api/auth/me', { credentials: 'same-origin' })
                    const text = await r.text()
                    console.log('Auth debug:', r.status, text)
                    toastInfo(`Auth check: ${r.status} — ${text}`)
                  } catch (e) {
                    toastError('Auth check failed: ' + String(e))
                  }
                }}
                className="btn"
              >
                Debug Auth
              </button>
            </div>
          </div>
        </div>
      )}

      {showSectionForm && (
        <div className="section-container">
          <div className="section-content">
            <SectionForm
              batchId={batchId}
              courseId={batchData.courseId}
              initialData={selectedSection || undefined}
              onSuccess={handleSectionSuccess}
              onCancel={() => {
                setShowSectionForm(false)
                setSelectedSection(null)
              }}
            />
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed top-6 right-6 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded shadow flex items-center gap-3">
          <div>{successMessage}</div>
          <div className="ml-2 flex items-center gap-2">
            <button
              onClick={() => {
                if (activeSessionId) {
                  const el = document.querySelector(`[data-session-id="${activeSessionId}"]`)
                  if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              }}
              className="px-3 py-1 bg-white border rounded text-sm"
            >
              View
            </button>
            <button
              onClick={() => {
                setSuccessMessage(null)
                setActiveSessionId(null)
              }}
              className="px-3 py-1 bg-white border rounded text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {sections.length === 0 && !showSectionForm ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FolderPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
          <p className="text-gray-600 mb-4">Get started by creating a section to organize your sessions</p>
          <button
            onClick={() => setShowSectionForm(true)}
            className="btn btn-success"
          >
            <Plus className="w-4 h-4" />
            Create First Section
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="section-container">
              <div className="section-header">
                <h3 className="section-title">{section.title}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedSection(section)
                      setShowSectionForm(true)
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteSectionId(section.id)}
                    className="p-2 text-gray-600 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/batches/${batchId}/sessions/new?sectionId=${section.id}`}
                    className="p-2 text-green-600 hover:text-green-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="section-content">
                <div className="mb-2 text-sm text-muted-foreground">{sessions.filter(s => s.sectionId === section.id).length} session(s)</div>
                {sessions.filter(session => session.sectionId === section.id).length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No sessions in this section yet
                  </div>
                ) : (
                  <div className="space-y-2">
                      {sessions
                      .filter(session => session.sectionId === section.id)
                      .map((session, idx) => (
                        <div key={session.id} className={`session-card ${activeSessionId === session.id ? 'ring-2 ring-green-200' : ''}`} data-session-id={session.id}>
                              <div className="session-left">
                                <div className="session-order">{idx + 1}</div>
                                <div className="session-meta">
                                  <div className="session-title">{session.title}</div>
                                  {session.duration && <div className="session-sub">{session.duration} minutes • order {idx + 1}</div>}
                                </div>
                              </div>

                              <div className="session-actions">
                                <Link href={`/batches/${batchId}/sessions/${session.id}/edit`} title="Edit" className="icon-btn"><Edit className="h-4 w-4" /></Link>
                                <button title="Publish/Unpublish" onClick={() => handleTogglePublish(session.id, !session.isPublished)} className="icon-btn">{session.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                                <button title="Move up" onClick={() => handleMoveSession(session.id, 'up')} className="icon-btn"><ArrowUp className="h-4 w-4" /></button>
                                <button title="Move down" onClick={() => handleMoveSession(session.id, 'down')} className="icon-btn"><ArrowDown className="h-4 w-4" /></button>
                                <button title="Delete" onClick={() => setConfirmDeleteSessionId(session.id)} className="icon-btn text-red-600"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={!!confirmDeleteSectionId}
        title="Delete Section"
        message="Are you sure you want to delete this section and all its sessions?"
        onCancel={() => setConfirmDeleteSectionId(null)}
        onConfirm={() => {
          if (confirmDeleteSectionId) doDeleteSection(confirmDeleteSectionId)
          setConfirmDeleteSectionId(null)
        }}
      />

      <ConfirmDialog
        open={!!confirmDeleteSessionId}
        title="Delete Session"
        message="Are you sure you want to delete this session?"
        onCancel={() => setConfirmDeleteSessionId(null)}
        onConfirm={() => {
          if (confirmDeleteSessionId) doDeleteSession(confirmDeleteSessionId)
          setConfirmDeleteSessionId(null)
        }}
      />
    </div>
  )
}