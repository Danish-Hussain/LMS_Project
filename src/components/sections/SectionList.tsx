'use client'

import { useEffect, useState, useRef } from 'react'
import useToast from '@/hooks/useToast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { ChevronDown, ChevronRight, Plus, Play, Edit, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

interface Section {
  id: string
  title: string
  description?: string | null
  order: number
  sessions: Session[]
}

interface Session {
  id: string
  title: string
  videoUrl: string | null
  duration: number | null
  isPublished: boolean
  order?: number
  sectionId: string | null
}

interface SectionListProps {
  batchId: string;
  isInstructor?: boolean;
  onEditSection: (section: Section) => void;
  onDeleteSection: (sectionId: string) => void;
}

export function SectionList({ batchId, isInstructor = false, onEditSection, onDeleteSection }: SectionListProps) {
  const [sections, setSections] = useState<Section[]>([])
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [inFlight, setInFlight] = useState<Set<string>>(new Set())
  const pendingDeletes = useRef<Map<string, { session: Session; timeoutId: ReturnType<typeof setTimeout> }>>(new Map())
  // site-wide toast helpers
  const { info: toastInfo, error: toastError, success: toastSuccess, remove } = useToast()
  const dragItem = useRef<{ sessionId: string; fromSectionId: string } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null)

  useEffect(() => {
    fetchSections()
  }, [batchId])

  const fetchSections = async () => {
    try {
      const response = await fetch(`/api/batches/${batchId}/sections`)
      if (response.ok) {
        const data = await response.json()
        setSections(data)
      } else {
        throw new Error('Failed to fetch sections')
      }
      } catch (error) {
  console.error('Failed to fetch sections:', error)
  toastError('Failed to load sections')
    } finally {
      setIsLoading(false)
    }
  }

  const setInFlightOn = (id: string) => setInFlight(prev => new Set(prev).add(id))
  const setInFlightOff = (id: string) => setInFlight(prev => { const n = new Set(prev); n.delete(id); return n })

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const handleDeleteSession = (sessionId: string) => {
    // open confirm dialog
    setConfirmTarget(sessionId)
    setConfirmOpen(true)
  }

  const handleDeleteSessionConfirmed = async (sessionId: string) => {
    setConfirmOpen(false)
    setConfirmTarget(null)
    // optimistic remove + undo
    const found = sections.flatMap(s => s.sessions).find(s => s.id === sessionId)
    if (!found) return

    // remove from UI
    setSections(prev => prev.map(sec => ({ ...sec, sessions: sec.sessions.filter(ss => ss.id !== sessionId) })))

  // create undo toast that calls undoDelete
  toastInfo(`Session "${found.title}" removed`, { id: sessionId, undo: () => undoDelete(sessionId) })

    // schedule final delete
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE', credentials: 'same-origin' })
        if (!res.ok) throw new Error('Failed to delete')
  // clear toast from provider (if available)
  try { remove(sessionId) } catch (e) { /* noop */ }
        pendingDeletes.current.delete(sessionId)
      } catch (err) {
  console.error('Final delete failed', err)
  toastError('Failed to delete session on server')
        // re-fetch to re-sync
        await fetchSections()
      }
    }, 8000)

    pendingDeletes.current.set(sessionId, { session: found, timeoutId })
  }

  const undoDelete = (sessionId: string) => {
    const pd = pendingDeletes.current.get(sessionId)
  if (!pd) return
    clearTimeout(pd.timeoutId)
    pendingDeletes.current.delete(sessionId)
    // restore session into its section (push at end)
    setSections(prev => prev.map(sec => sec.id === (pd.session.sectionId || '') ? { ...sec, sessions: [...sec.sessions, pd.session] } : sec))
    // provider will remove toast when undo calls remove
    // nothing else to do here
  }

  // no local toasts; provider handles auto-dismiss

  const handleTogglePublish = async (sessionId: string, publish: boolean) => {
    // optimistic
    setInFlightOn(sessionId)
    const prev = sections
    setSections(prevS => prevS.map(sec => ({ ...sec, sessions: sec.sessions.map(ss => ss.id === sessionId ? { ...ss, isPublished: publish } : ss) })))
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: publish })
      })
      if (!res.ok) throw new Error('Failed to update')
      } catch (err) {
  console.error('Toggle publish failed', err)
  toastError('Failed to update session')
      // revert
      setSections(prev)
    } finally {
      setInFlightOff(sessionId)
    }
  }

  const handleMoveSession = async (sessionId: string, direction: 'up' | 'down') => {
    // optimistic reorder within its section
    const prev = JSON.parse(JSON.stringify(sections)) as Section[]
    // find section and index
    const secIndex = sections.findIndex(sec => sec.sessions.some(s => s.id === sessionId))
    if (secIndex === -1) return
    const sec = sections[secIndex]
    const idx = sec.sessions.findIndex(s => s.id === sessionId)
    if (idx === -1) return
    const newIdx = direction === 'up' ? Math.max(0, idx - 1) : Math.min(sec.sessions.length - 1, idx + 1)
    if (newIdx === idx) return

    // reorder locally
    const newSections = sections.map((s, i) => {
      if (i !== secIndex) return s
      const newSessions = [...s.sessions]
      const [moved] = newSessions.splice(idx, 1)
      newSessions.splice(newIdx, 0, moved)
      // reassign order based on index+1
      return { ...s, sessions: newSessions.map((ss, idx2) => ({ ...ss, order: idx2 + 1 })) }
    })
    setSections(newSections)
    setInFlightOn(sessionId)
    try {
      // persist orders for the section in parallel
      const sectionToPersist = newSections[secIndex]
      await Promise.all(sectionToPersist.sessions.map(ss => fetch(`/api/sessions/${ss.id}`, {
        method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: ss.order })
      })))
    } catch (err) {
  console.error('Move session failed', err)
  toastError('Failed to move session')
      setSections(prev)
    } finally {
      setInFlightOff(sessionId)
    }
  }

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, sessionId: string, sectionId: string) => {
    dragItem.current = { sessionId, fromSectionId: sectionId }
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropOnSession = async (e: React.DragEvent, targetSessionId: string, targetSectionId: string) => {
    e.preventDefault()
    const dragged = dragItem.current
    if (!dragged) return
    const { sessionId: draggedId, fromSectionId } = dragged
    // if same position, ignore
    if (draggedId === targetSessionId) return

    const prev = JSON.parse(JSON.stringify(sections)) as Section[]
    // remove dragged
    let draggedSession: Session | null = null
    const withoutDragged = sections.map(s => ({ ...s, sessions: s.sessions.filter(ss => { if (ss.id === draggedId) { draggedSession = ss; return false } return true }) }))
    // insert into target section before target session
    const newSections = withoutDragged.map(s => {
      if (s.id !== targetSectionId) return s
      const idx = s.sessions.findIndex(ss => ss.id === targetSessionId)
      const newSessions = [...s.sessions]
      if (draggedSession) newSessions.splice(idx === -1 ? newSessions.length : idx, 0, draggedSession)
      return { ...s, sessions: newSessions.map((ss, i) => ({ ...ss, order: i + 1 })) }
    })

    setSections(newSections)
    // persist orders for affected sections
    try {
      const affected = newSections.filter(s => s.id === fromSectionId || s.id === targetSectionId)
      await Promise.all(affected.flatMap(s => s.sessions.map(ss => fetch(`/api/sessions/${ss.id}`, { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: ss.order }) }))))
    } catch (err) {
  console.error('Drag reorder failed', err)
  toastError('Failed to persist order')
      setSections(prev)
    } finally {
      dragItem.current = null
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading sections...</div>
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No sections yet. Create one to get started.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sections.map(section => (
        <div key={section.id} className="bg-white rounded-lg shadow-sm">
          <div 
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection(section.id)}
          >
            <div className="flex items-center">
              {expandedSections.has(section.id) ? (
                <ChevronDown className="h-5 w-5 text-gray-400 mr-2" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400 mr-2" />
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
                {section.description && (
                  <p className="text-sm text-gray-500">{section.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditSection(section)
                }}
                className="text-blue-600 hover:text-blue-700"
                title="Edit section"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteSection(section.id)
                }}
                className="text-red-600 hover:text-red-700"
                title="Delete section"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <Link href={`/batches/${batchId}/sessions/new?sectionId=${section.id}`} className="text-green-600 hover:text-green-700" onClick={(e) => e.stopPropagation()} title="Add session">
                <Plus className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          {expandedSections.has(section.id) && (
            <div className="border-t border-gray-100">
              {section.sessions.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No sessions in this section
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {section.sessions.map((session, idx) => (
                    <div key={session.id} className="border rounded-md p-3 flex items-center justify-between bg-white" draggable onDragStart={(e) => handleDragStart(e, session.id, section.id)} onDragOver={handleDragOver} onDrop={(e) => handleDropOnSession(e, session.id, section.id)}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 flex items-center justify-center bg-gray-50 border rounded text-sm font-mono text-gray-700">{session.order ?? idx + 1}</div>
                        <div>
                          <div className="text-sm font-medium">{session.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{session.duration ? `${session.duration} minutes` : ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Link href={`/batches/${batchId}/sessions/${session.id}`} className="text-sm px-3 py-1 border rounded">View</Link>
                        <Link href={`/batches/${batchId}/sessions/${session.id}/edit`} className="text-gray-600 hover:text-gray-800" onClick={(e) => e.stopPropagation()}><Edit className="h-4 w-4" /></Link>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!inFlight.has(session.id)) handleTogglePublish(session.id, !session.isPublished) }} className="text-gray-600" title={session.isPublished ? 'Unpublish' : 'Publish'}>{inFlight.has(session.id) ? <span className="inline-block w-4 h-4 border-2 border-gray-300 rounded-full animate-spin" /> : (session.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />)}</button>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!inFlight.has(session.id)) handleMoveSession(session.id, 'up') }} className="text-gray-600"><ArrowUp className="h-4 w-4" /></button>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!inFlight.has(session.id)) handleMoveSession(session.id, 'down') }} className="text-gray-600"><ArrowDown className="h-4 w-4" /></button>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!inFlight.has(session.id)) handleDeleteSession(session.id) }} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                        {!session.isPublished && isInstructor && <div className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Draft</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      {/* provider renders toasts globally */}
      
      <Link
        href={`/batches/${batchId}/sections/new`}
        className="block text-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50"
      >
        <Plus className="h-6 w-6 text-gray-400 mx-auto mb-2" />
        <span className="text-sm font-medium text-gray-600">Add new section</span>
      </Link>
    </div>
  )
}
