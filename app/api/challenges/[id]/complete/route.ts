import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/database';
import { getUserIdFromRequest } from '@/app/lib/userUtils';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { subArticleId, userId: requestUserId } = body;
    const userId = requestUserId || getUserIdFromRequest(request);

    // Get the challenge article
    const challenge = await prisma.article.findUnique({
      where: { id },
      select: {
        isChallenge: true,
        challengeStartDate: true,
        challengeEndDate: true,
        challengeDuration: true,
      },
    });

    if (!challenge || !challenge.isChallenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    if (!challenge.challengeStartDate || !challenge.challengeEndDate) {
      return NextResponse.json(
        { error: 'Challenge dates not configured' },
        { status: 400 }
      );
    }

    const now = new Date();
    const startDate = new Date(challenge.challengeStartDate);
    const endDate = new Date(challenge.challengeEndDate);

    // Check if challenge is active
    if (now < startDate || now > endDate) {
      return NextResponse.json(
        { error: 'Challenge is not active' },
        { status: 400 }
      );
    }

    // Calculate which day of the challenge we're on
    const daysDiff = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const currentDay = daysDiff + 1; // Day 1 is the start date

    // Check if this exercise was already completed today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const existingProgress = await prisma.challengeProgress.findFirst({
      where: {
        articleId: id,
        subArticleId,
        userId,
        completedAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    if (existingProgress) {
      return NextResponse.json(
        { message: 'Already completed today', progress: existingProgress },
        { status: 200 }
      );
    }

    // Create progress entry
    const progress = await prisma.challengeProgress.create({
      data: {
        articleId: id,
        subArticleId,
        userId,
        completedAt: now,
        day: currentDay,
      },
    });

    // Also mark the sub-article as temporarily unpublished
    await prisma.article.update({
      where: { id: subArticleId },
      data: {
        temporarilyUnpublished: true,
        unpublishedDate: now,
      },
    });

    return NextResponse.json({
      message: 'Challenge exercise completed',
      progress,
      day: currentDay
    });
  } catch (error) {
    console.error('Error completing challenge exercise:', error);
    return NextResponse.json(
      { error: 'Failed to complete challenge exercise' },
      { status: 500 }
    );
  }
}