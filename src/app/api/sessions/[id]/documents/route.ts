import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

type HandlerContext<T extends Record<string, string> = Record<string, string>> = {
  params: Promise<T> | T
}

// GET - Fetch documents for a session
export async function GET(request: NextRequest, context: HandlerContext<{ id: string }>) {
  try {
    const params = (await context.params) as { id: string }
    const sessionId = params.id

    const documents = await prisma.sessionDocument.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching session documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// POST - Add a document to a session
export async function POST(request: NextRequest, context: HandlerContext<{ id: string }>) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await verifyToken(token)

    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const params = (await context.params) as { id: string }
    const sessionId = params.id
    const body = await request.json() as { name: string; url: string; size?: number; mimeType?: string }

    const { name, url, size, mimeType } = body

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      )
    }

    const document = await prisma.sessionDocument.create({
      data: {
        sessionId,
        name,
        url,
        size: size || null,
        mimeType: mimeType || null
      }
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error creating session document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a document
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await verifyToken(token)

    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    await prisma.sessionDocument.delete({
      where: { id: documentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting session document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}