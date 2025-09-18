'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AudioPlayer from '../AudioPlayer'

interface ArticleSlideProps {
  article: {
    id: string
    title: string
    subtitle?: string | null
    content: string
    audioUrl?: string | null
    textAlign?: string
    verticalAlign?: string
    isProject?: boolean
    parentId?: string | null
  }
  onComplete?: (articleId: string) => Promise<void>
}

export default function ArticleSlide({ article, onComplete }: ArticleSlideProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const textAlign = article.textAlign || 'left'
  const verticalAlign = article.verticalAlign || 'center'

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
    <div className="h-full flex flex-col relative">
      {/* Scrollable content container with proper margins for navigation */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden article-scroll`} style={{ paddingTop: '80px', paddingBottom: '80px', paddingLeft: '5px', paddingRight: '15px' }}>
        <div className={`flex flex-col ${getVerticalAlignClasses()} min-h-full`}>
          <div className="px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-6">
            <div className={`w-full max-w-none ${getTextAlignClasses()} space-y-4 sm:space-y-6`} style={{ wordWrap: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>
            <h1 className={`font-bold text-gray-900 dark:text-gray-100 responsive-title inline-flex items-center gap-2 ${textAlign === 'right' ? 'justify-end' : ''}`}>
              <span>{article.title}</span>
              {article.audioUrl && (
                <AudioPlayer audioUrl={article.audioUrl} title={article.title} />
              )}
            </h1>

            {article.subtitle && (
              <p className="text-gray-600 dark:text-gray-400 font-medium responsive-subtitle">
                {article.subtitle}
              </p>
            )}

            <div
              className={`text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none responsive-content ${textAlign === 'right' ? 'prose-headings:text-right prose-p:text-right' : 'prose-headings:text-left prose-p:text-left'}`}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
            </div>
          </div>
        </div>
      </div>

      {/* Complete button for project slides */}
      {article.isProject && (
        <div className="absolute bottom-8 right-8 z-10">
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