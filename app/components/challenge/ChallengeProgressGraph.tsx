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
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">Loading progress...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!progressData) {
    return null;
  }

  const { stats, dailyProgress } = progressData;
  const maxBarHeight = 200;

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Current Day</div>
          <div className="text-2xl font-bold">{stats.currentDay}/{duration}</div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Days Remaining</div>
          <div className="text-2xl font-bold">{stats.daysRemaining}</div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
          <div className="text-2xl font-bold">🔥 {stats.currentStreak}</div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</div>
          <div className="text-2xl font-bold">{stats.overallPercentage}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span>Challenge Progress</span>
          <span>{stats.totalCompleted} / {stats.totalExercises * duration} exercises</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
            style={{ width: `${stats.overallPercentage}%` }}
          />
        </div>
      </div>

      {/* Daily Progress Chart */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-4">Daily Completion Rate</h3>
        <div className="relative h-64 border-l border-b border-gray-300 dark:border-gray-600">
          <div className="absolute -left-12 top-0 text-xs text-gray-500">100%</div>
          <div className="absolute -left-12 top-1/2 text-xs text-gray-500">50%</div>
          <div className="absolute -left-12 bottom-0 text-xs text-gray-500">0%</div>

          <div className="flex items-end h-full gap-1 px-2">
            {dailyProgress.map((day) => {
              const barHeight = (day.percentage / 100) * maxBarHeight;
              return (
                <div
                  key={day.day}
                  className="flex-1 flex flex-col items-center justify-end"
                  title={`Day ${day.day}: ${day.completed}/${day.total} (${day.percentage}%)`}
                >
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                    style={{ height: `${barHeight}px` }}
                  />
                  {day.day % 5 === 0 && (
                    <div className="text-xs mt-1 text-gray-500">{day.day}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded" />
          <span>Daily Completion</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded" />
          <span>Overall Progress</span>
        </div>
      </div>
    </div>
  );
}