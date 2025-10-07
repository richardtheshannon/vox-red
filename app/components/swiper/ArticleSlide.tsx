'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AudioPlayer from '../AudioPlayer'
import AutoRowPlayButton from '../AutoRowPlayButton'
import { getAnonymousUserId } from '@/app/lib/userUtils'

interface ArticleSlideProps {
  article: {
    id: string
    title: string
    subtitle?: string | null
    content: string | null
    audioUrl?: string | null
    textAlign?: string
    verticalAlign?: string
    isProject?: boolean
    isFavorite?: boolean
    temporarilyUnpublished?: boolean
    parentId?: string | null
    articleType?: string | null
  }
  onComplete?: (articleId: string) => Promise<void>
  showAutoRowPlay?: boolean // Optional prop to show auto-row-play button
  onScrollStatusChange?: (hasOverflow: boolean, isAtBottom: boolean, isAtTop: boolean) => void
  isInChallenge?: boolean // New prop to indicate if this is part of a challenge
  challengeId?: string // The parent challenge article ID
  isCompleted?: boolean // Whether this exercise has been completed today
}

export default function ArticleSlide({
  article,
  onComplete,
  showAutoRowPlay = false,
  onScrollStatusChange,
  isInChallenge = false,
  challengeId,
  isCompleted = false
}: ArticleSlideProps) {
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isUnpublishing, setIsUnpublishing] = useState(false)
  const [isChallengeCompleted, setIsChallengeCompleted] = useState(isCompleted)
  const [isCompletingChallenge, setIsCompletingChallenge] = useState(false)
  const [colors, setColors] = useState<{
    dark: Record<string, { background: string; heading: string; subHeading: string; content: string }>;
    light: Record<string, { background: string; heading: string; subHeading: string; content: string }>;
  } | null>(null)
  const router = useRouter()
  const textAlign = article.textAlign || 'left'
  const verticalAlign = article.verticalAlign || 'center'
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch color settings
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch('/api/settings/article-type-colors/public')
        if (response.ok) {
          const data = await response.json()
          setColors(data)
        }
      } catch (error) {
        console.error('Error fetching colors:', error)
      }
    }
    fetchColors()
  }, [])

  // Listen for theme changes
  useEffect(() => {
    // Set initial theme
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setTheme(isDark ? 'dark' : 'light')
    }

    checkTheme()

    // Watch for theme changes using MutationObserver
    const observer = new MutationObserver(() => {
      checkTheme()
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  // Check scroll status and notify parent
  const checkScrollStatus = useCallback(() => {
    if (!scrollRef.current || !onScrollStatusChange) return

    const element = scrollRef.current
    const hasOverflow = element.scrollHeight > element.clientHeight
    const isAtBottom = Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) < 5
    const isAtTop = element.scrollTop < 5



    onScrollStatusChange(hasOverflow, isAtBottom, isAtTop)
  }, [onScrollStatusChange, article.id])

  // Monitor scroll position and content changes
  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    // Check initial state with a slight delay to ensure content is rendered
    const checkInitialState = () => {
      setTimeout(() => {
        checkScrollStatus()
      }, 100)
    }

    checkInitialState()

    // Listen for scroll events
    const handleScroll = () => {
      checkScrollStatus()
    }

    element.addEventListener('scroll', handleScroll, { passive: true })

    // Also check when content might have changed (using ResizeObserver)
    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize checks to avoid excessive calls
      setTimeout(() => {
        checkScrollStatus()
      }, 50)
    })

    resizeObserver.observe(element)

    // Check again after images or other content might have loaded
    const checkAfterLoad = setTimeout(() => {
      checkScrollStatus()
    }, 500)

    return () => {
      element.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
      clearTimeout(checkAfterLoad)
    }
  }, [checkScrollStatus])

  // Get colors based on article type and theme
  const getColors = () => {
    // Use dynamic colors if available, otherwise use defaults
    const defaultDarkColors = {
      meditation: {
        background: '#250902',
        heading: '#fbbf24',
        subHeading: '#fcd34d',
        content: '#e5e7eb'
      },
      education: {
        background: '#38040e',
        heading: '#f9a8d4',
        subHeading: '#fbcfe8',
        content: '#e5e7eb'
      },
      personal: {
        background: '#640d14',
        heading: '#fca5a5',
        subHeading: '#fecaca',
        content: '#e5e7eb'
      },
      spiritual: {
        background: '#333333',
        heading: '#d4d4d8',
        subHeading: '#e4e4e7',
        content: '#e5e7eb'
      },
      routine: {
        background: '#800e13',
        heading: '#f9a8d4',
        subHeading: '#fbcfe8',
        content: '#e5e7eb'
      },
      notSet: {
        background: '#ad2831',
        heading: '#fca5a5',
        subHeading: '#fecaca',
        content: '#e5e7eb'
      }
    }

    const defaultLightColors = {
      meditation: {
        background: '#f0e6e0',
        heading: '#92400e',
        subHeading: '#78350f',
        content: '#1f2937'
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
    }

    const defaultColors = theme === 'dark' ? defaultDarkColors : defaultLightColors
    const articleTypeKey = article.articleType || 'notSet'

    if (colors) {
      const colorSet = theme === 'dark' ? colors.dark : colors.light
      // Check if colors are in old format (string) or new format (object)
      if (colorSet[articleTypeKey]) {
        if (typeof colorSet[articleTypeKey] === 'string') {
          // Old format - use defaults for text colors
          return {
            background: colorSet[articleTypeKey],
            heading: defaultColors[articleTypeKey as keyof typeof defaultColors].heading,
            subHeading: defaultColors[articleTypeKey as keyof typeof defaultColors].subHeading,
            content: defaultColors[articleTypeKey as keyof typeof defaultColors].content
          }
        } else {
          // New format - use custom colors
          return colorSet[articleTypeKey]
        }
      }
    }

    // Fallback to defaults if colors haven't loaded
    return defaultColors[articleTypeKey as keyof typeof defaultColors] || defaultColors.notSet
  }


  // Create audio tracks for auto-row-play (only if this article has audio)
  const getAudioTracks = () => {
    if (showAutoRowPlay && article.audioUrl) {
      return [{
        url: article.audioUrl,
        title: article.title,
        articleId: article.id,
        slideIndex: 0 // Single slide is always at index 0
      }]
    }
    return []
  }

  // Determine text alignment classes
  const getTextAlignClasses = () => {
    switch (textAlign) {
      case 'right':
        return 'text-right'
      default:
        return 'text-left'
    }
  }

  // Determine vertical alignment classes for the article-scroll container
  const getVerticalAlignClasses = () => {
    switch (verticalAlign) {
      case 'center':
        return 'justify-center'
      case 'bottom':
        return 'justify-end'
      default:
        return 'justify-start'
    }
  }

  const handleStarClick = async () => {
    if (isUnpublishing) return

    // Show confirmation dialog
    const action = article.temporarilyUnpublished ? 'republish' : 'temporarily unpublish'
    const confirmed = confirm(`Are you sure you want to ${action} this article for the rest of the day?`)
    if (!confirmed) return

    setIsUnpublishing(true)
    try {
      const response = await fetch(`/api/articles/${article.id}/temporarily-unpublish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // SSE will handle the live update automatically
        console.log('Article temporarily unpublished, SSE will update the view')
      } else {
        console.error('Failed to toggle unpublish status')
      }
    } catch (error) {
      console.error('Error toggling unpublish status:', error)
    } finally {
      setIsUnpublishing(false)
    }
  }

  const handleChallengeComplete = async () => {
    if (isCompletingChallenge || isChallengeCompleted) return

    // Show confirmation dialog
    const confirmed = confirm('Mark this exercise as completed for today?')
    if (!confirmed) return

    setIsCompletingChallenge(true)
    try {
      // Complete the challenge exercise
      const response = await fetch(`/api/challenges/${challengeId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subArticleId: article.id,
          userId: getAnonymousUserId()
        }),
      })

      if (response.ok) {
        setIsChallengeCompleted(true)

        // Also mark as temporarily unpublished for visual consistency
        const unpublishResponse = await fetch(`/api/articles/${article.id}/temporarily-unpublish`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (unpublishResponse.ok) {
          console.log('Challenge exercise completed and marked as unpublished')
        }
      } else {
        console.error('Failed to complete challenge exercise')
      }
    } catch (error) {
      console.error('Error completing challenge exercise:', error)
    } finally {
      setIsCompletingChallenge(false)
    }
  }

  const handleComplete = async () => {
    if (loading) return

    // Show confirmation dialog
    const confirmed = confirm('Are you sure you have completed this step?')
    if (!confirmed) return

    setLoading(true)
    try {
      if (onComplete) {
        // Use the parent's complete handler if provided
        await onComplete(article.id)
      } else {
        // Fallback to the original behavior
        const response = await fetch('/api/articles/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ articleId: article.id }),
        })

        await response.json()

        if (response.ok) {
          // Refresh the page to show changes
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Error completing slide:', error)
    } finally {
      setLoading(false)
    }
  }

  const articleColors = getColors()

  return (
    <div className="h-full flex flex-col relative" style={{ backgroundColor: articleColors.background }}>
      {/* Auto-row-play button for single articles */}
      {showAutoRowPlay && <AutoRowPlayButton audioTracks={getAudioTracks()} />}
      {/* Fixed Header - 80px */}
      <div className="absolute top-0 left-0 right-0 h-20 z-50 flex items-center justify-between px-4">
        {/* Header icons will be positioned here by the existing components */}
      </div>

      {/* Fixed Footer - 80px */}
      <div className="absolute bottom-0 left-0 right-0 h-20 z-50 flex items-center justify-between px-4">
        {/* Footer icons will be positioned here by the existing components */}
      </div>

      {/* Fixed height scrollable container with strict margins */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden article-scroll"
        style={{
          top: '80px',
          bottom: '80px',
          left: '5px',
          right: '15px'
        }}
      >
        {/* Challenge completion checkmark icon for challenge exercises */}
        {isInChallenge && (
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={handleChallengeComplete}
              disabled={isCompletingChallenge || isChallengeCompleted}
              className="transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-400 rounded p-1"
              aria-label={isChallengeCompleted ? 'Exercise completed' : 'Mark exercise as complete'}
              title={isChallengeCompleted ? 'Completed today' : 'Click to mark as complete'}
            >
              {isCompletingChallenge ? (
                <span className="material-icons text-3xl text-gray-500 animate-pulse">
                  hourglass_empty
                </span>
              ) : (
                <span className={`material-icons text-3xl transition-colors ${
                  isChallengeCompleted
                    ? 'text-green-500'
                    : 'text-gray-400 hover:text-green-500'
                }`}>
                  {isChallengeCompleted ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Favorite star icon - fixed in top-left corner of article-scroll, clickable */}
        {!isInChallenge && article.isFavorite && (
          <div className="fixed top-24 left-6 z-40">
            <button
              onClick={handleStarClick}
              disabled={isUnpublishing}
              className="transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded p-1"
              aria-label={article.temporarilyUnpublished ? 'Republish article' : 'Temporarily unpublish article'}
              title={article.temporarilyUnpublished ? 'Click to republish for the rest of the day' : 'Click to hide for the rest of the day'}
            >
              {isUnpublishing ? (
                <span className="material-icons text-3xl text-gray-500 animate-pulse">
                  hourglass_empty
                </span>
              ) : (
                <span className={`material-icons text-3xl transition-colors ${
                  article.temporarilyUnpublished
                    ? 'text-gray-500 dark:text-gray-600'
                    : 'text-yellow-500 hover:text-yellow-600'
                }`}>
                  star
                </span>
              )}
            </button>
          </div>
        )}
        <div className={`flex flex-col ${getVerticalAlignClasses()} min-h-full`}>
          <div className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-6">
            <div className={`w-full max-w-none ${getTextAlignClasses()} space-y-4 sm:space-y-6`} style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>
            <h1
              className={`font-bold responsive-title inline-flex items-center gap-2 ${textAlign === 'right' ? 'justify-end' : ''}`}
              style={{ color: articleColors.heading }}
            >
              <span>{article.title}</span>
              {article.audioUrl && (
                <AudioPlayer audioUrl={article.audioUrl} title={article.title} articleId={article.id} />
              )}
            </h1>

            {(article.articleType || article.subtitle) && (
              <div className="my-3 flex flex-wrap gap-2">
                {article.articleType && article.articleType !== 'notSet' && (
                  <span
                    className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border`}
                    style={{
                      color: articleColors.subHeading,
                      borderColor: articleColors.subHeading + '40',
                      backgroundColor: articleColors.subHeading + '15'
                    }}
                  >
                    {article.articleType}
                  </span>
                )}
                {article.subtitle && (
                  <span
                    className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border`}
                    style={{
                      color: articleColors.subHeading,
                      borderColor: articleColors.subHeading + '40',
                      backgroundColor: articleColors.subHeading + '15'
                    }}
                  >
                    {article.subtitle}
                  </span>
                )}
              </div>
            )}

            <div
              className={`prose max-w-none responsive-content ${textAlign === 'right' ? 'prose-headings:text-right prose-p:text-right' : 'prose-headings:text-left prose-p:text-left'}`}
              style={{ color: articleColors.content }}
              dangerouslySetInnerHTML={{ __html: article.content || '' }}
            />
            </div>
          </div>
        </div>
      </div>


      {/* Complete button for project slides */}
      {article.isProject && (
        <div className="absolute bottom-6 right-6 z-50">
          <button
            onClick={handleComplete}
            disabled={loading}
            className="transition-opacity hover:opacity-70"
            aria-label="Mark as complete"
          >
            {loading ? (
              <span className="material-icons text-2xl text-gray-500">hourglass_empty</span>
            ) : (
              <span className="material-icons text-2xl text-green-600">how_to_reg</span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}