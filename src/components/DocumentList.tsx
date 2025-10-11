"use client"

import { useState, useEffect } from 'react'

interface SessionDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

interface DocumentListProps {
  sessionId: string;
  isInstructor?: boolean;
  onUpload?: (document: SessionDocument) => void;
}

export function DocumentList({ sessionId, isInstructor = false }: DocumentListProps) {
  const [documents, setDocuments] = useState<SessionDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/documents`);
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError('Failed to load documents');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [sessionId]);

  const handleDownload = (document: SessionDocument) => {
    window.open(document.fileUrl, '_blank');
  };

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (err) {
      setError('Failed to delete document');
      console.error(err);
    }
  };

  if (error) {
    return (
      <div className="text-red-500">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        Loading documents...
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <h3 className="font-medium text-lg">Session Documents</h3>
      {documents.length === 0 ? (
        <p className="text-gray-500">No documents available</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {documents.map((document) => (
            <li key={document.id} className="py-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">{document.fileName}</span>
                <span className="text-sm text-gray-400">
                  ({(document.fileSize / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownload(document)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Download
                </button>
                {isInstructor && (
                  <button
                    onClick={() => handleDelete(document.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}