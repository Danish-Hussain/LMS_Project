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
    <div className="group relative flex items-center justify-between p-3 bg-white hover:bg-blue-50/40 border border-transparent hover:border-blue-100 rounded-md transition-all duration-200">
      <div className="flex items-center flex-grow mr-4">
        <div className="flex-grow">
          <div className="flex items-center space-x-3">
            {!isInstructor && (
              <button
                type="button"
                onClick={handleStatusClick}
                className={`flex-shrink-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full p-1 ${
                  initialCompleted 
                    ? 'bg-green-100 hover:bg-green-200' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                aria-label={initialCompleted ? "Mark as incomplete" : "Mark as complete"}
              >
                {initialCompleted ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                )}
              </button>
            )}
            <h4 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{title}</h4>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {!isPublished && (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
            Draft
          </span>
        )}
        {isInstructor && (
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
            {onEdit && (
              <button
                onClick={() => onEdit(id)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(id)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
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