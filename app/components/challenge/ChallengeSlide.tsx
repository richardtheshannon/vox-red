'use client';

import { useState, useEffect } from 'react';
import ChallengeProgressGraph from './ChallengeProgressGraph';
import AudioPlayer from '../AudioPlayer';

interface ChallengeSlideProps {
  article: {
    id: string;
    title: string;
    subtitle?: string | null;
    challengeDuration?: number | null;
    challengeStartDate?: Date | string | null;
    challengeEndDate?: Date | string | null;
    articleType?: string | null;
    audioUrl?: string | null;
    media?: {
      id: string;
      url: string;
    } | null;
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
  const [colors, setColors] = useState<{
    dark: Record<string, { background: string; heading: string; subHeading: string; content: string }>;
    light: Record<string, { background: string; heading: string; subHeading: string; content: string }>;
  } | null>(null);

  // Fetch color settings
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch('/api/settings/article-type-colors/public');
        if (response.ok) {
          const data = await response.json();
          setColors(data);
        }
      } catch (error) {
        console.error('Error fetching colors:', error);
      }
    };
    fetchColors();
  }, []);

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

  // Get article colors based on type and theme
  const getColors = () => {
    // Default colors for each article type in dark theme
    const defaultDarkColors = {
      meditation: {
        background: '#1a1a1a',
        heading: '#e5e7eb',
        subHeading: '#d1d5db',
        content: '#9ca3af'
      },
      education: {
        background: '#1a1a1a',
        heading: '#fbbf24',
        subHeading: '#f59e0b',
        content: '#d1d5db'
      },
      personal: {
        background: '#1a1a1a',
        heading: '#f87171',
        subHeading: '#ef4444',
        content: '#d1d5db'
      },
      spiritual: {
        background: '#1a1a1a',
        heading: '#a78bfa',
        subHeading: '#8b5cf6',
        content: '#d1d5db'
      },
      routine: {
        background: '#1a1a1a',
        heading: '#60a5fa',
        subHeading: '#3b82f6',
        content: '#d1d5db'
      },
      notSet: {
        background: '#1a1a1a',
        heading: '#e5e7eb',
        subHeading: '#d1d5db',
        content: '#9ca3af'
      }
    };

    // Default colors for each article type in light theme
    const defaultLightColors = {
      meditation: {
        background: '#ffffff',
        heading: '#1f2937',
        subHeading: '#374151',
        content: '#4b5563'
      },
      education: {
        background: '#f5e0e5',
        heading: '#831843',
        subHeading: '#9f1239',
        content: '#1f2937'
      },
      personal: {
        background: '#fde2e4',
        heading: '#991b1b',
        subHeading: '#b91c1c',
        content: '#1f2937'
      },
      spiritual: {
        background: '#e8e8e8',
        heading: '#374151',
        subHeading: '#4b5563',
        content: '#1f2937'
      },
      routine: {
        background: '#ffd7db',
        heading: '#831843',
        subHeading: '#9f1239',
        content: '#1f2937'
      },
      notSet: {
        background: '#ffc9cc',
        heading: '#991b1b',
        subHeading: '#b91c1c',
        content: '#1f2937'
      }
    };

    const defaultColors = theme === 'dark' ? defaultDarkColors : defaultLightColors;
    const articleTypeKey = article.articleType || 'notSet';

    if (colors) {
      const colorSet = theme === 'dark' ? colors.dark : colors.light;
      // Check if colors are in old format (string) or new format (object)
      if (colorSet[articleTypeKey]) {
        if (typeof colorSet[articleTypeKey] === 'string') {
          // Old format - use defaults for text colors
          return {
            background: colorSet[articleTypeKey],
            heading: defaultColors[articleTypeKey as keyof typeof defaultColors].heading,
            subHeading: defaultColors[articleTypeKey as keyof typeof defaultColors].subHeading,
            content: defaultColors[articleTypeKey as keyof typeof defaultColors].content
          };
        } else {
          // New format - use custom colors
          return colorSet[articleTypeKey];
        }
      }
    }

    // Fallback to defaults if colors haven't loaded
    return defaultColors[articleTypeKey as keyof typeof defaultColors] || defaultColors.notSet;
  };

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
  const articleColors = getColors();

  return (
    <div
      className="h-full w-full flex items-center justify-center relative"
      style={{
        backgroundColor: backgroundColor || articleColors.background,
      }}
    >
      <div className="w-full max-w-2xl px-6 space-y-6">
        {/* Title and Badges */}
        <div className="text-center space-y-3">
          {/* Title */}
          <h1
            className="text-3xl font-bold"
            style={{ color: headingColor || articleColors.heading }}
          >
            {article.title}
          </h1>

          {/* Subtitle */}
          {article.subtitle && (
            <p
              className="text-lg opacity-80"
              style={{ color: subHeadingColor || articleColors.subHeading }}
            >
              {article.subtitle}
            </p>
          )}

          {/* Status Badges */}
          <div className="flex items-center justify-center gap-2">
            <span className={`${status.color} text-white text-xs px-3 py-1 rounded-full font-medium`}>
              {status.label}
            </span>
            {article.articleType && article.articleType !== 'notSet' && (
              <span
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{
                  backgroundColor: subHeadingColor ? `${subHeadingColor}20` : `${articleColors.subHeading}20`,
                  color: subHeadingColor || articleColors.subHeading,
                }}
              >
                {article.articleType}
              </span>
            )}
            <span className="text-xs px-3 py-1 rounded-full font-medium bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
              {article.challengeDuration || 30} Day Challenge
            </span>
          </div>
        </div>

        {/* Progress Graph - Embedded inline */}
        <ChallengeProgressGraph
          challengeId={article.id}
          duration={article.challengeDuration || 30}
          startDate={article.challengeStartDate || null}
          endDate={article.challengeEndDate || null}
        />

        {/* Audio Player - Only show if audio is available */}
        {(article.audioUrl || article.media?.url) && (
          <div className="flex justify-center">
            <AudioPlayer
              audioUrl={article.audioUrl || article.media?.url || ''}
              title={article.title}
              articleId={article.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}