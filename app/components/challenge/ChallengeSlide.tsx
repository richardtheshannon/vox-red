'use client';

import { useState, useEffect } from 'react';
import ChallengeProgressGraph from './ChallengeProgressGraph';

interface ChallengeSlideProps {
  article: {
    id: string;
    title: string;
    subtitle?: string | null;
    challengeDuration?: number | null;
    challengeStartDate?: Date | string | null;
    challengeEndDate?: Date | string | null;
    articleType?: string | null;
  };
  backgroundColor?: string;
  headingColor?: string;
  subHeadingColor?: string;
}

export default function ChallengeSlide({
  article,
  backgroundColor,
  headingColor,
  subHeadingColor,
}: ChallengeSlideProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Listen for theme changes
  useEffect(() => {
    // Set initial theme
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };

    checkTheme();

    // Watch for theme changes using MutationObserver
    const observer = new MutationObserver(() => {
      checkTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Calculate challenge status
  const getStatus = () => {
    if (!article.challengeStartDate || !article.challengeEndDate) {
      return { label: 'Not Configured', color: 'bg-gray-500' };
    }

    const now = new Date();
    const start = new Date(article.challengeStartDate);
    const end = new Date(article.challengeEndDate);

    if (now < start) {
      return { label: 'Upcoming', color: 'bg-yellow-500' };
    } else if (now > end) {
      return { label: 'Completed', color: 'bg-gray-500' };
    } else {
      return { label: 'Active', color: 'bg-green-500' };
    }
  };

  const status = getStatus();

  return (
    <div
      className="h-full w-full flex flex-col relative"
      style={{
        backgroundColor: backgroundColor || (theme === 'dark' ? '#1a1a1a' : '#ffffff'),
      }}
    >
      {/* Header */}
      <div className="p-6 pb-2">
        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`${status.color} text-white text-xs px-3 py-1 rounded-full font-medium`}>
            {status.label}
          </span>
          {article.articleType && article.articleType !== 'notSet' && (
            <span
              className="text-xs px-3 py-1 rounded-full font-medium"
              style={{
                backgroundColor: subHeadingColor ? `${subHeadingColor}20` : 'rgba(107, 114, 128, 0.1)',
                color: subHeadingColor || '#6b7280',
              }}
            >
              {article.articleType}
            </span>
          )}
          <span className="text-xs px-3 py-1 rounded-full font-medium bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
            {article.challengeDuration || 30} Day Challenge
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: headingColor || (theme === 'dark' ? '#ffffff' : '#000000') }}
        >
          {article.title}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p
            className="text-lg opacity-80"
            style={{ color: subHeadingColor || (theme === 'dark' ? '#d1d5db' : '#4b5563') }}
          >
            {article.subtitle}
          </p>
        )}
      </div>

      {/* Progress Graph */}
      <div className="flex-1 overflow-hidden">
        <ChallengeProgressGraph
          challengeId={article.id}
          duration={article.challengeDuration || 30}
          startDate={article.challengeStartDate || null}
          endDate={article.challengeEndDate || null}
        />
      </div>
    </div>
  );
}