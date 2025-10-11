"use client"

import React, { createContext, useContext, useReducer, useCallback } from 'react'

type ToastType = 'info' | 'error' | 'success'
type Toast = { id: string; message: string; type?: ToastType; meta?: any; duration?: number }

type State = { toasts: Toast[] }
type Action = { type: 'PUSH'; toast: Toast } | { type: 'REMOVE'; id: string }

const initialState: State = { toasts: [] }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'PUSH':
      return { toasts: [action.toast, ...state.toasts] }
    case 'REMOVE':
      return { toasts: state.toasts.filter(t => t.id !== action.id) }
    default:
      return state
  }
}

interface ToastContextShape {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'> & { id?: string }) => string
  remove: (id: string) => void
  info: (msg: string, opts?: { id?: string; undo?: () => void; duration?: number }) => string
  success: (msg: string, opts?: { id?: string; undo?: () => void; duration?: number }) => string
  error: (msg: string, opts?: { id?: string; undo?: () => void; duration?: number }) => string
}

const ToastContext = createContext<ToastContextShape | null>(null)

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const remove = useCallback((id: string) => dispatch({ type: 'REMOVE', id }), [])

  const push = useCallback((payload: Omit<Toast, 'id'> & { id?: string }) => {
    const id = payload.id || Math.random().toString(36).slice(2, 9)
    const toast: Toast = { id, message: payload.message, type: payload.type || 'info', meta: payload.meta, duration: payload.duration ?? 5000 }
    dispatch({ type: 'PUSH', toast })
    setTimeout(() => dispatch({ type: 'REMOVE', id }), toast.duration)
    return id
  }, [])

  const info = useCallback((msg: string, opts?: any) => push({ message: msg, type: 'info', meta: { undo: opts?.undo }, duration: opts?.duration }), [push])
  const success = useCallback((msg: string, opts?: any) => push({ message: msg, type: 'success', meta: { undo: opts?.undo }, duration: opts?.duration }), [push])
  const error = useCallback((msg: string, opts?: any) => push({ message: msg, type: 'error', meta: { undo: opts?.undo }, duration: opts?.duration }), [push])

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, push, remove, info, success, error }}>
      {children}
  {/* aria-live region for accessibility + styled toasts */}
  <div aria-live="polite" suppressHydrationWarning={true} className="fixed bottom-6 right-6 z-50 space-y-2">
        {state.toasts.map(t => (
          <div key={t.id} role="status" className={`toast-item flex items-center gap-3 max-w-xs px-4 py-2 rounded shadow ${t.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : t.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-white border'}`}>
            <div className="flex-1 text-sm">{t.message}</div>
            <div className="flex items-center gap-2">
              {t.meta?.undo && <button onClick={() => { t.meta.undo(); remove(t.id) }} className="px-3 py-1 bg-gray-100 rounded text-sm">Undo</button>}
              <button onClick={() => remove(t.id)} className="px-2 py-1 text-gray-500">✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToastContext = () => useContext(ToastContext)
