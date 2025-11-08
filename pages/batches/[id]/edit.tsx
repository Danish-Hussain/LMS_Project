import type { NextPage } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'

// Pages Router compatibility wrapper for the Edit Batch screen.
// Do NOT re-export the App Router component directly here because it expects
// an App Router `params` prop at build-time, which causes prerender errors in
// some hosting environments. Instead, read the dynamic `id` from the query.

const EditBatchPage: NextPage = () => {
	const { query } = useRouter()
	const id = typeof query.id === 'string' ? query.id : ''

	return (
		<div className="min-h-screen p-8">
			<div className="max-w-3xl mx-auto">
				<h1 className="text-2xl font-bold mb-4">Edit Batch</h1>
				<p className="text-gray-600 mb-6">Batch ID: {id || '(unknown)'}</p>
				<p className="text-sm text-gray-500">This page is a Pages Router compatibility placeholder.
					The App Router version lives at <code>src/app/batches/[id]/edit/page.tsx</code>.</p>
				<div className="mt-6">
					<Link href={`/batches/${id || ''}/sessions`} className="px-4 py-2 bg-blue-600 text-white rounded">
						Back to Sessions
					</Link>
				</div>
			</div>
		</div>
	)
}

export default EditBatchPage
