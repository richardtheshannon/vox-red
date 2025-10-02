import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();

    // Find all active challenges
    const challenges = await prisma.article.findMany({
      where: {
        isChallenge: true,
        challengeStartDate: { lte: now },
        challengeEndDate: { gte: now },
        published: true,
      },
      include: {
        subArticles: {
          select: { id: true },
        },
        challengeProgress: {
          select: { id: true },
        },
      },
      orderBy: { orderPosition: 'asc' },
    });

    // Calculate stats for each challenge
    const challengesWithStats = challenges.map((challenge) => {
      const totalExercises = challenge.subArticles.length;
      const totalDays = challenge.challengeDuration || 30;
      const startTime = challenge.challengeStartDate?.getTime() || 0;
      const currentDay = Math.floor((now.getTime() - startTime) / (1000 * 60 * 60 * 24)) + 1;

      const totalPossibleCompletions = totalExercises * currentDay;
      const actualCompletions = challenge.challengeProgress.length;
      const overallPercentage = totalPossibleCompletions > 0
        ? Math.round((actualCompletions / totalPossibleCompletions) * 100)
        : 0;

      return {
        id: challenge.id,
        title: challenge.title,
        subtitle: challenge.subtitle,
        duration: totalDays,
        startDate: challenge.challengeStartDate,
        endDate: challenge.challengeEndDate,
        currentDay,
        totalExercises,
        overallPercentage,
        totalCompletions: actualCompletions,
      };
    });

    return NextResponse.json({ challenges: challengesWithStats });
  } catch (error) {
    console.error('Error fetching active challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active challenges' },
      { status: 500 }
    );
  }
}