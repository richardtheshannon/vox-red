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

  // Determine vertical alignment classes
  const getVerticalAlignClasses = () => {
    switch (verticalAlign) {
      case 'top':
        return 'justify-start'
      case 'bottom':
        return 'justify-end'
      default:
        return 'justify-center'
    }
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

  const handleComplete = async () => {
    if (loading) return

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
      {/* Scrollable content area */}
      <div className={`article-scroll flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8 md:p-12 lg:p-16 xl:p-20 pb-16 sm:pb-20 md:pb-24 lg:pb-28 xl:pb-32 ${article.isProject ? 'pb-32 sm:pb-36 md:pb-40 lg:pb-44 xl:pb-48' : ''}`}>
        <div className={`min-h-full flex flex-col ${getVerticalAlignClasses()}`}>
          <div className={`w-full ${getTextAlignClasses()} space-y-4 sm:space-y-6`}>
            <h1 className="font-bold text-gray-900 dark:text-gray-100 responsive-title">
              {article.title}
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

            {/* Audio Player */}
            {article.audioUrl && (
              <div className="mt-6">
                <AudioPlayer audioUrl={article.audioUrl} title={article.title} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Complete button for project slides - only show on project sub-articles */}
      {article.isProject && article.parentId && (
        <div className="fixed bottom-8 right-8 z-10">
          <button
            onClick={handleComplete}
            disabled={loading}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-lg transition-colors"
          >
            {loading ? 'Processing...' : 'Complete'}
          </button>
        </div>
      )}
    </div>
  )
}