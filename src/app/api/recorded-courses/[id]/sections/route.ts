import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
    const url = new URL(req.url)
    const previewOnly = url.searchParams.get('preview') === 'true'

    // Get recorded course sections
    const sectionsRaw = await prisma.courseSection.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        sessions: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    let sections: any = sectionsRaw
    if (previewOnly) {
      const withPreview = sectionsRaw.map((sec) => ({
        ...sec,
        sessions: (sec.sessions || []).filter((s: any) => !!s.isPreview),
      }))
      const hasAnyPreview = withPreview.some((sec) => (sec.sessions?.length || 0) > 0)
      if (hasAnyPreview) {
        sections = withPreview
      } else {
        // Fallback: if no sessions marked preview anywhere, surface the first session (if any) per section
        sections = sectionsRaw.map((sec) => ({
          ...sec,
          sessions: sec.sessions && sec.sessions.length > 0 ? [sec.sessions[0]] : [],
        }))
      }
    }

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
    const { title, description, order } = await req.json();

    // Create section without batch for recorded course
    const section = await prisma.courseSection.create({
      data: {
        title,
        description,
        order: order || 1,
        courseId,
      },
      include: {
        sessions: true,
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    );
  }
}
