// Session documents API removed. Return 410 Gone for any method to ensure the
// route doesn't accidentally accept requests and satisfies Next's Route types.

export async function GET() {
	return new Response('Gone', { status: 410 })
}

export async function POST() {
	return new Response('Gone', { status: 410 })
}

export async function DELETE() {
	return new Response('Gone', { status: 410 })
}