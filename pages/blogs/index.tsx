"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

type Blog = {
	id: string
	title: string
	topic?: string
	excerpt?: string
	coverImage?: string
	createdAt?: string
	isPublished?: boolean
}

export default function BlogsPage() {
	const { user } = useAuth()
	const isPrivileged = !!user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR')
	const [blogs, setBlogs] = useState<Blog[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch('/api/blogs')
				if (res.ok) {
					const data = await res.json()
					setBlogs(Array.isArray(data) ? data : [])
				}
			} finally {
				setLoading(false)
			}
		})()
	}, [])

	if (loading) return <div className="p-6">Loading…</div>

	return (
		<div className="max-w-5xl mx-auto p-6">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-bold">Blogs</h1>
				{isPrivileged && (
					<Link href="/blogs/new" className="px-3 py-1.5 rounded bg-blue-600 text-white">New</Link>
				)}
			</div>
			{blogs.length === 0 ? (
				<div className="text-gray-600">No blogs yet.</div>
			) : (
				<ul className="space-y-3">
					{blogs.map((b) => (
						<li key={b.id} className="border rounded p-3">
							<Link href={`/blogs/${b.id}`} className="font-semibold hover:underline">{b.title}</Link>
							{b.topic && <div className="text-xs text-gray-600">{b.topic}</div>}
							{b.excerpt && <p className="text-sm text-gray-700 mt-1">{b.excerpt}</p>}
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
