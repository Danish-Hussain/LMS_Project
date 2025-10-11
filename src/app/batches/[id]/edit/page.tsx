import Link from 'next/link'

export default function EditBatchPage({ params }: any) {
  const { id } = params
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Edit Batch</h1>
        <p className="text-gray-600 mb-6">Batch ID: {id}</p>
        <p className="text-sm text-gray-500">This page is a placeholder edit page. You can implement full edit UI here.</p>
        <div className="mt-6">
          <Link href={`/batches/${id}/sessions`} className="px-4 py-2 bg-blue-600 text-white rounded">Back to Sessions</Link>
        </div>
      </div>
    </div>
  )
}
