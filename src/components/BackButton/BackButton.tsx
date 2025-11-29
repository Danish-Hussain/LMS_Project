"use client"
import { useRouter } from 'next/navigation'
import React from 'react'

export default function BackButton() {
  const router = useRouter()

  const handleBack = () => {
    // prefer history back, otherwise go to blogs listing
    try {
      if (window.history.length > 1) router.back()
      else router.push('/blogs')
    } catch (e) {
      router.push('/blogs')
    }
  }

  return (
    <button
      aria-label="Go back"
      onClick={handleBack}
      className="fixed left-4 top-28 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100 border border-gray-200"
      title="Back"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M15 18l-6-6 6-6" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
