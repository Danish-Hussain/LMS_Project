"use client"

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function BlogEditButton({ id }: { id: string }) {
  const { user } = useAuth()
  if (!user) return null
  if (!(user.role === 'ADMIN' || user.role === 'INSTRUCTOR')) return null

  return (
    <div className="mb-4">
      <Link href={`/blogs/${id}/edit`} className="btn btn-primary">
        Edit
      </Link>
    </div>
  )
}
