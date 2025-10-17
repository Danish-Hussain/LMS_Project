import { CheckCircle, Circle } from 'lucide-react'
import { useState } from 'react'

interface SessionListItemProps {
  id: string
  title: string
  // description and duration removed from UI
  isPublished?: boolean
  isCompleted?: boolean
  onStatusChange?: (id: string, completed: boolean) => void
  isInstructor?: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function SessionListItem({
  id,
  title,
  isPublished,
  isCompleted: initialCompleted = false,
  onStatusChange,
  isInstructor = false,
  onEdit,
  onDelete
}: SessionListItemProps) {
  const handleStatusClick = async (e: React.MouseEvent) => {
    // Prevent event propagation to avoid triggering session selection
    e.stopPropagation()
    
    try {
      const newStatus = !initialCompleted
      onStatusChange?.(id, newStatus)
    } catch (error) {
      console.error('Failed to update session status:', error)
    }
  }

  return (
    <div className="group relative flex items-center justify-between p-3 border rounded-md transition-all duration-200" style={{ background: 'var(--section-bg)', borderColor: 'var(--section-border)' }}>
      <div className="flex items-center flex-grow mr-4">
        <div className="flex-grow">
          <div className="flex items-center space-x-3">
            {!isInstructor && (
              <button
                type="button"
                onClick={handleStatusClick}
                className={`flex-shrink-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full p-1`}
                style={{ 
                  background: initialCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)' 
                }}
                aria-label={initialCompleted ? "Mark as incomplete" : "Mark as complete"}
              >
                {initialCompleted ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4" style={{ color: 'var(--session-subtext)' }} />
                )}
              </button>
            )}
            <h4 className="font-medium transition-colors" style={{ color: 'var(--foreground)' }}>{title}</h4>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {!isPublished && (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderColor: 'rgba(234, 179, 8, 0.3)' }}>
            Draft
          </span>
        )}
        {isInstructor && (
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
            {onEdit && (
              <button
                onClick={() => onEdit(id)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)', borderColor: 'rgba(37, 99, 235, 0.3)' }}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(id)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}