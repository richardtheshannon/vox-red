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
      {/* 100px margin from top */}
      <div style={{ height: '100px' }}></div>

      {/* Scrollable content container with margins */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden article-scroll" style={{ marginBottom: '100px' }}>
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

      {/* Complete button for project slides */}
      {article.isProject && (
        <div className="absolute bottom-8 right-8 z-10">
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