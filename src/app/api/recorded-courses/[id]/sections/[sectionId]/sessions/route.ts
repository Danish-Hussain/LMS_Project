import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  req: Request,
  {
    params,
  }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const { id: courseId, sectionId } = await params;
    const { title, videoUrl, order, isPreview } = await req.json();

    const session = await prisma.session.create({
      data: {
        title,
        videoUrl,
        order: order || 1,
        courseId,
        sectionId,
        ...(typeof isPreview === 'boolean' ? { isPreview } : {}),
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
