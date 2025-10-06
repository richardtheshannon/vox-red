import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/database';
import { getUserIdFromRequest } from '@/app/lib/userUtils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || getUserIdFromRequest(request);

    // Get the challenge with its sub-articles
    const challenge = await prisma.article.findUnique({
      where: { id },
      include: {
        subArticles: {
          select: {
            id: true,
            title: true,
          },
          orderBy: { orderPosition: 'asc' },
        },
        challengeProgress: {
          where: { userId },
          orderBy: { completedAt: 'desc' },
        },
      },
    });

    if (!challenge || !challenge.isChallenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Calculate stats
    const totalExercises = challenge.subArticles.length;
    const totalDays = challenge.challengeDuration || 30;
    const now = new Date();

    let currentDay = 0;
    let daysRemaining = totalDays;
    let isActive = false;

    if (challenge.challengeStartDate && challenge.challengeEndDate) {
      const startDate = new Date(challenge.challengeStartDate);
      const endDate = new Date(challenge.challengeEndDate);
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      const nowTime = now.getTime();

      if (nowTime >= startTime && nowTime <= endTime) {
        isActive = true;
        currentDay = Math.floor((nowTime - startTime) / (1000 * 60 * 60 * 24)) + 1;
        daysRemaining = Math.ceil((endTime - nowTime) / (1000 * 60 * 60 * 24));
      } else if (nowTime > endTime) {
        currentDay = totalDays;
        daysRemaining = 0;
      }
    }

    // Group progress by day
    const progressByDay: Record<number, string[]> = {};
    challenge.challengeProgress.forEach((progress) => {
      if (!progressByDay[progress.day]) {
        progressByDay[progress.day] = [];
      }
      progressByDay[progress.day].push(progress.subArticleId);
    });

    // Calculate completion percentage for each day
    const dailyProgress = [];
    for (let day = 1; day <= currentDay; day++) {
      const completedCount = progressByDay[day]?.length || 0;
      const percentage = totalExercises > 0
        ? Math.round((completedCount / totalExercises) * 100)
        : 0;

      dailyProgress.push({
        day,
        completed: completedCount,
        total: totalExercises,
        percentage,
      });
    }

    // Calculate current streak
    let currentStreak = 0;
    for (let day = currentDay; day >= 1; day--) {
      if (progressByDay[day] && progressByDay[day].length > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Get today's completed exercises
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const todayProgress = challenge.challengeProgress.filter(
      (progress) =>
        progress.completedAt >= startOfToday &&
        progress.completedAt <= endOfToday &&
        progress.userId === userId
    );

    const todayCompletedIds = todayProgress.map((p) => p.subArticleId);

    return NextResponse.json({
      challenge: {
        id: challenge.id,
        title: challenge.title,
        duration: totalDays,
        startDate: challenge.challengeStartDate,
        endDate: challenge.challengeEndDate,
        isActive,
      },
      stats: {
        currentDay,
        daysRemaining,
        totalExercises,
        currentStreak,
        totalCompleted: challenge.challengeProgress.length,
        overallPercentage: Math.round(
          (challenge.challengeProgress.length / (totalExercises * totalDays)) * 100
        ),
      },
      dailyProgress,
      todayCompleted: todayCompletedIds,
      exercises: challenge.subArticles,
    });
  } catch (error) {
    console.error('Error fetching challenge progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge progress' },
      { status: 500 }
    );
  }
}