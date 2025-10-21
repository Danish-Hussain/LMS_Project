"use client"

import React from 'react'

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }: { open: boolean; title?: string; message?: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string; cancelLabel?: string }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 border rounded">{cancelLabel}</button>
          <button onClick={onConfirm} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
