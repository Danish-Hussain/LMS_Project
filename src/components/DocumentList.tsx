import React from 'react'
import { FileText, Download } from 'lucide-react'

export interface DocumentListProps {
  documents: Array<{
    id: string
    name: string
    url: string
    size?: number | null
  }>
}

const DocumentList: React.FC<DocumentListProps> = ({ documents }) => {
  if (!documents || documents.length === 0) return null

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return ''
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
  }

  return (
    <div className="mt-6 p-4 rounded-lg border" style={{ background: 'var(--section-bg)', borderColor: 'var(--section-border)' }}>
      <h4 className="font-semibold mb-3 flex items-center" style={{ color: 'var(--foreground)' }}>
        <FileText className="h-5 w-5 mr-2" />
        Session Documents
      </h4>
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li key={doc.id} className="rounded-md p-3 transition-colors hover-bg-accent" style={{ background: 'var(--background)' }}>
            <a 
              href={doc.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-between group"
            >
              <div className="flex items-center space-x-2 flex-1">
                <FileText className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-medium group-hover:text-blue-600 transition-colors" style={{ color: 'var(--foreground)' }}>
                  {doc.name}
                </span>
                {doc.size && (
                  <span className="text-xs" style={{ color: 'var(--session-subtext)' }}>({formatFileSize(doc.size)})</span>
                )}
              </div>
              <Download className="h-4 w-4 group-hover:text-blue-600 transition-colors" style={{ color: 'var(--session-subtext)' }} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DocumentList