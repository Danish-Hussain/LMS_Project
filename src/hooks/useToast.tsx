"use client"

import { useToastContext, ToastContextShape } from '@/components/ui/ToastProvider'

type ToastOpts = { id?: string; undo?: () => void; duration?: number }
type ToastHelper = (message: string, opts?: ToastOpts) => string | void

export const useToast = (): { info: ToastHelper; success: ToastHelper; error: ToastHelper; remove: (id: string) => void } => {
  const ctx = useToastContext() as ToastContextShape | null

  if (!ctx) {
    // noop fallback when provider is missing; reference args to avoid unused var warnings
    const info: ToastHelper = (message: string, opts?: ToastOpts) => { void message; void opts; console.warn('ToastProvider not found') }
    const success: ToastHelper = (message: string, opts?: ToastOpts) => { void message; void opts; console.warn('ToastProvider not found') }
    const error: ToastHelper = (message: string, opts?: ToastOpts) => { void message; void opts; console.warn('ToastProvider not found') }
    const remove = (id: string) => { void id }
    return { info, success, error, remove }
  }
  const { info, success, error, remove } = ctx
  return { info, success, error, remove }
}

export default useToast
