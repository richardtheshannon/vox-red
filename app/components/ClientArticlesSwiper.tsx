'use client'

import { useMemo, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import LoadingSpinner from './ui/LoadingSpinner'
import { shouldShowArticle } from '@/app/lib/publishingUtils'
import { useRealtime } from '@/app/hooks/useRealtime'

const ArticlesSwiper = dynamic(() => import('./swiper/ArticlesSwiper'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">Loading articles...</p>
      </div>
    </div>
  ),
})

interface Article {
  id: string
  title: string
  subtitle?: string | null
  content: string | null
  audioUrl?: string | null
  orderPosition: number
  textAlign?: string
  verticalAlign?: string
  parentId?: string | null
  subArticles?: Article[]
  published: boolean
  isProject: boolean
  isFavorite?: boolean
  temporarilyUnpublished?: boolean
  pauseDuration?: number | null
  publishTimeStart?: string | null
  publishTimeEnd?: string | null
  publishDays?: string | null
  rowPublishTimeStart?: string | null
  rowPublishTimeEnd?: string | null
  rowPublishDays?: string | null
  articleType?: string | null
}

interface ClientArticlesSwiperProps {
  initialArticles: Article[]
}

export default function ClientArticlesSwiper({ initialArticles }: ClientArticlesSwiperProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [articles, setArticles] = useState(initialArticles)
  const { refreshTrigger } = useRealtime()

  // Update time every minute to check if articles should appear/disappear
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  // Refresh articles when SSE notifications are received
  useEffect(() => {
    if (refreshTrigger > 0) {
      const fetchArticles = async () => {
        try {
          const response = await fetch('/api/articles')
          if (response.ok) {
            const updatedArticles = await response.json()
            setArticles(updatedArticles)
          }
        } catch (error) {
          console.error('Error fetching updated articles:', error)
        }
      }
      fetchArticles()
    }
  }, [refreshTrigger])

  // Helper function to determine effective publishing settings for an article
  const getEffectivePublishingSettings = (article: Article, parentArticle?: Article) => {
    // For main articles: use row publishing settings if they exist, otherwise use individual settings
    if (!article.parentId) {
      return {
        publishTimeStart: article.rowPublishTimeStart || article.publishTimeStart,
        publishTimeEnd: article.rowPublishTimeEnd || article.publishTimeEnd,
        publishDays: article.rowPublishDays || article.publishDays,
        published: article.published,
        temporarilyUnpublished: article.temporarilyUnpublished,
        isProject: article.isProject
      }
    }

    // For sub-articles: use parent's row publishing settings if they exist, otherwise use individual settings
    if (parentArticle) {
      return {
        publishTimeStart: parentArticle.rowPublishTimeStart || article.publishTimeStart,
        publishTimeEnd: parentArticle.rowPublishTimeEnd || article.publishTimeEnd,
        publishDays: parentArticle.rowPublishDays || article.publishDays,
        published: article.published,
        temporarilyUnpublished: article.temporarilyUnpublished,
        isProject: article.isProject
      }
    }

    // Fallback to individual settings
    return {
      publishTimeStart: article.publishTimeStart,
      publishTimeEnd: article.publishTimeEnd,
      publishDays: article.publishDays,
      published: article.published,
      temporarilyUnpublished: article.temporarilyUnpublished,
      isProject: article.isProject
    }
  }

  // Filter articles based on current browser time and day
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      // Filter sub-articles first
      if (article.subArticles) {
        const filteredSubArticles = article.subArticles.filter(subArticle => {
          // Get effective publishing settings for sub-article (inherits from parent row settings)
          const effectiveSettings = getEffectivePublishingSettings(subArticle, article)

          // Apply time/day filtering using effective settings
          return shouldShowArticle(effectiveSettings)
        })
        article.subArticles = filteredSubArticles
      }

      // Get effective publishing settings for main article (uses row settings if available)
      const mainEffectiveSettings = getEffectivePublishingSettings(article)

      // Show the row if: main article is published and passes filters OR has any published sub-articles
      const mainArticleShows = shouldShowArticle(mainEffectiveSettings)
      const hasPublishedSubArticles = article.subArticles && article.subArticles.length > 0

      return mainArticleShows || hasPublishedSubArticles
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articles, currentTime])

  return <ArticlesSwiper initialArticles={filteredArticles} />
}