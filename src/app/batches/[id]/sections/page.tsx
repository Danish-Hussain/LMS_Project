'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useToast from '@/hooks/useToast'
import { SectionForm } from '@/components/sections/SectionForm'
import { SectionList } from '@/components/sections/SectionList'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface Section {
  id: string
  title: string
  description?: string | null
  order: number
  sessions: any[]
}

export default function BatchSectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [showForm, setShowForm] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [courseId, setCourseId] = useState<string | null>(null)
  const [batchId, setBatchId] = useState<string>(resolvedParams.id)
  const { info: toastInfo, error: toastError, success: toastSuccess } = useToast()
  const [confirmDeleteSectionId, setConfirmDeleteSectionId] = useState<string | null>(null)

  useEffect(() => {
    // Set batch ID from params
    setBatchId(resolvedParams.id)
    
    // Fetch the batch to get the courseId
    const fetchBatch = async () => {
      try {
        const response = await fetch(`/api/batches/${batchId}`)
        if (response.ok) {
          const batch = await response.json()
          setCourseId(batch.courseId)
        }
      } catch (error) {
        console.error('Failed to fetch batch:', error)
      }
    }

    if (batchId) {
      fetchBatch()
    }
  }, [batchId])

  const handleSuccess = () => {
    setShowForm(false)
    setEditingSection(null)
    router.refresh()
  }

  const handleEditSection = (section: Section) => {
    setEditingSection(section)
    setShowForm(true)
  }

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const response = await fetch(`/api/batches/${batchId}/sections/${sectionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.refresh()
      } else {
        toastError('Failed to delete section')
      }
    } catch (error) {
      console.error('Error deleting section:', error)
      toastError('An error occurred while deleting the section')
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link 
            href={`/batches/${batchId}`}
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Batch
          </Link>
          <h1 className="text-2xl font-bold">Manage Sections</h1>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Section
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingSection ? 'Edit Section' : 'Add New Section'}
          </h2>
          <SectionForm
            batchId={batchId}
            courseId={courseId!}
            initialData={editingSection || undefined}
            onSuccess={handleSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingSection(null)
            }}
          />
        </div>
      ) : (
        <>
          <SectionList
            batchId={batchId}
            onEditSection={handleEditSection}
            onDeleteSection={(id) => setConfirmDeleteSectionId(id)}
          />

          <ConfirmDialog
            open={!!confirmDeleteSectionId}
            title="Delete Section"
            message="Are you sure you want to delete this section and its sessions?"
            onCancel={() => setConfirmDeleteSectionId(null)}
            onConfirm={() => {
              if (confirmDeleteSectionId) handleDeleteSection(confirmDeleteSectionId)
              setConfirmDeleteSectionId(null)
            }}
          />
        </>
      )}
    </div>
  )
}
