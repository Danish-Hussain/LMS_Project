"use client"

import { useCallback } from 'react'
import { useToastContext } from '@/components/ui/ToastProvider'

type ToastHelper = (message: string, opts?: any) => string | void

export const useToast = (): { info: ToastHelper; success: ToastHelper; error: ToastHelper; remove: (id: string) => void } => {
  const ctx = useToastContext()

  if (!ctx) {
    // noop fallback when provider is missing
    const info: ToastHelper = (_message: string, _opts?: any) => { console.warn('ToastProvider not found') }
    const success: ToastHelper = (_message: string, _opts?: any) => { console.warn('ToastProvider not found') }
    const error: ToastHelper = (_message: string, _opts?: any) => { console.warn('ToastProvider not found') }
    const remove = (_id: string) => {}
    return { info, success, error, remove }
  }
  const { push, remove, info, success, error } = ctx as any
  return { info, success, error, remove }
}

export default useToast
