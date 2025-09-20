'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AudioPlayer from '../AudioPlayer'
import AutoRowPlayButton from '../AutoRowPlayButton'

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
    parentId?: string | null
    articleType?: string | null
  }
  onComplete?: (articleId: string) => Promise<void>
  showAutoRowPlay?: boolean // Optional prop to show auto-row-play button
}

export default function ArticleSlide({ article, onComplete, showAutoRowPlay = false }: ArticleSlideProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const textAlign = article.textAlign || 'left'
  const verticalAlign = article.verticalAlign || 'center'

  // Get background color based on article type
  const getBackgroundColor = () => {
    switch (article.articleType) {
      case 'meditation':
        return '#250902'
      case 'education':
        return '#38040e'
      case 'personal':
        return '#640d14'
      case 'spiritual':
        return '#333333'
      case 'routine':
        return '#800e13'
      default:
        return '#ad2831' // Not Set or null
    }
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

  return (
    <div className="h-full flex flex-col relative" style={{ backgroundColor: getBackgroundColor() }}>
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
        className="absolute inset-0 overflow-y-auto overflow-x-hidden article-scroll"
        style={{
          top: '80px',
          bottom: '80px',
          left: '5px',
          right: '15px'
        }}
      >
        {/* Favorite star icon - fixed in top-left corner of article-scroll */}
        {article.isFavorite && (
          <div className="fixed top-24 left-6 z-40">
            <span className="material-icons text-3xl text-gray-900 dark:text-gray-100">
              star
            </span>
          </div>
        )}
        <div className={`flex flex-col ${getVerticalAlignClasses()} min-h-full`}>
          <div className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-6">
            <div className={`w-full max-w-none ${getTextAlignClasses()} space-y-4 sm:space-y-6`} style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>
            <h1 className={`font-bold text-gray-900 dark:text-gray-100 responsive-title inline-flex items-center gap-2 ${textAlign === 'right' ? 'justify-end' : ''}`}>
              <span>{article.title}</span>
              {article.audioUrl && (
                <AudioPlayer audioUrl={article.audioUrl} title={article.title} articleId={article.id} />
              )}
            </h1>

            {article.subtitle && (
              <p className="text-gray-600 dark:text-gray-400 font-medium responsive-subtitle">
                {article.subtitle}
              </p>
            )}

            <div
              className={`text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none responsive-content ${textAlign === 'right' ? 'prose-headings:text-right prose-p:text-right' : 'prose-headings:text-left prose-p:text-left'}`}
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