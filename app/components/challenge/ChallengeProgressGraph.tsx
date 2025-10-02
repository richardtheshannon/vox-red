'use client';

import { useEffect, useState, useCallback } from 'react';

interface ChallengeProgressGraphProps {
  challengeId: string;
  duration: number;
  startDate: string | Date | null;
  endDate: string | Date | null;
}

interface ProgressData {
  stats: {
    currentDay: number;
    daysRemaining: number;
    totalExercises: number;
    currentStreak: number;
    totalCompleted: number;
    overallPercentage: number;
  };
  dailyProgress: Array<{
    day: number;
    completed: number;
    total: number;
    percentage: number;
  }>;
}

export default function ChallengeProgressGraph({
  challengeId,
  duration,
}: ChallengeProgressGraphProps) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgressData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/challenges/${challengeId}/progress`);

      if (!response.ok) {
        throw new Error('Failed to fetch progress data');
      }

      const data = await response.json();
      setProgressData({
        stats: data.stats,
        dailyProgress: data.dailyProgress,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500 dark:text-gray-400">Loading progress...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!progressData) {
    return null;
  }

  const { stats } = progressData;

  return (
    <div className="w-full space-y-4">
      {/* Condensed Stats - Simple text display */}
      <div className="flex justify-around text-center">
        <div>
          <div className="text-3xl font-bold">{stats.currentDay}/{duration}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Day</div>
        </div>
        <div>
          <div className="text-3xl font-bold">{stats.daysRemaining}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Remaining</div>
        </div>
        <div>
          <div className="text-3xl font-bold">🔥 {stats.currentStreak}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Streak</div>
        </div>
        <div>
          <div className="text-3xl font-bold">{stats.overallPercentage}%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">Complete</div>
        </div>
      </div>

      {/* Slim Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
          style={{ width: `${stats.overallPercentage}%` }}
        />
      </div>

      {/* Minimal progress text */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        {stats.totalCompleted} of {stats.totalExercises * duration} exercises completed
      </div>
    </div>
  );
}