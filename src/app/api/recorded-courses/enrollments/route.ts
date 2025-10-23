import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Ensure the token corresponds to an existing user record
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 401 });
    }

    const body = await request.json();
    const { recordedCourseId } = body;

    if (!recordedCourseId) {
      return NextResponse.json(
        { message: 'Recorded course ID is required' },
        { status: 400 }
      );
    }

    // Check if recorded course exists and is published
    const recordedCourse = await prisma.recordedCourse.findUnique({
      where: { id: recordedCourseId },
      select: { id: true, isPublished: true }
    });

    if (!recordedCourse) {
      return NextResponse.json(
        { message: 'Recorded course not found' },
        { status: 404 }
      );
    }

    if (!recordedCourse.isPublished) {
      return NextResponse.json(
        { message: 'This course is not yet available for enrollment' },
        { status: 400 }
      );
    }

    // Check if already enrolled
  const existingEnrollment = await (prisma as any).recordedCourseEnrollment.findUnique({
      where: {
        userId_recordedCourseId: {
          userId: user.id,
          recordedCourseId
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { message: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Create enrollment
  const enrollment = await (prisma as any).recordedCourseEnrollment.create({
      data: {
        userId: user.id,
        recordedCourseId,
        enrolledAt: new Date()
      }
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error('Error enrolling in recorded course:', error);
    return NextResponse.json(
      { message: 'Failed to enroll in course', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

