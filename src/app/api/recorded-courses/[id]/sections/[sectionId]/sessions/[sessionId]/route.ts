import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; sectionId: string; sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    await prisma.session.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; sectionId: string; sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const body = await req.json().catch(() => ({})) as { isPreview?: boolean; isPublished?: boolean; title?: string; videoUrl?: string }

    const data: any = {}
    if (typeof body.isPreview === 'boolean') data.isPreview = body.isPreview
    if (typeof body.isPublished === 'boolean') data.isPublished = body.isPublished
    if (typeof body.title === 'string') data.title = body.title
    if (typeof body.videoUrl === 'string') data.videoUrl = body.videoUrl
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data,
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}
