import { CheckCircle, Circle, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface SessionListItemProps {
  id: string
  title: string
  description?: string | null
  duration?: number | null
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
  description,
  duration,
  isPublished,
  isCompleted: initialCompleted = false,
  onStatusChange,
  isInstructor = false,
  onEdit,
  onDelete
}: SessionListItemProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted)

  const handleStatusClick = async () => {
    try {
      const newStatus = !isCompleted
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: id,
          completed: newStatus,
          watchedTime: 0
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update progress')
      }

      setIsCompleted(newStatus)
      onStatusChange?.(id, newStatus)
    } catch (error) {
      console.error('Failed to update session status:', error)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-center flex-grow mr-4">
        <div className="flex-grow">
          <div className="flex items-center">
            <h4 className="font-medium text-gray-900">{title}</h4>
            {!isInstructor && (
              <button
                onClick={handleStatusClick}
                className="ml-3 text-gray-400 hover:text-blue-500 transition-colors focus:outline-none"
                aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
          {duration && (
            <p className="text-xs text-gray-500">
              {Math.floor(duration)} minutes
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {!isPublished && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Draft
          </span>
        )}
        {isInstructor && onEdit && (
          <button
            onClick={() => onEdit(id)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Edit
          </button>
        )}
        {isInstructor && onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}