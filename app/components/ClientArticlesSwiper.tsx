'use client'

import { useMemo, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import LoadingSpinner from './ui/LoadingSpinner'
import { shouldShowArticle } from '@/app/lib/publishingUtils'

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
  content: string
  audioUrl?: string | null
  orderPosition: number
  textAlign?: string
  verticalAlign?: string
  parentId?: string | null
  subArticles?: Article[]
  published: boolean
  isProject: boolean
  publishTimeStart?: string | null
  publishTimeEnd?: string | null
  publishDays?: string | null
}

interface ClientArticlesSwiperProps {
  initialArticles: Article[]
}

export default function ClientArticlesSwiper({ initialArticles }: ClientArticlesSwiperProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute to check if articles should appear/disappear
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  // Filter articles based on current browser time and day
  const filteredArticles = useMemo(() => {
    return initialArticles.filter(article => {
      // Filter sub-articles first
      if (article.subArticles) {
        const filteredSubArticles = article.subArticles.filter(subArticle => {
          // Apply time/day filtering to all articles (both standard and project)
          return shouldShowArticle(subArticle)
        })
        article.subArticles = filteredSubArticles
      }

      // Apply time/day filtering to all articles (both standard and project)
      return shouldShowArticle(article)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialArticles, currentTime])

  return <ArticlesSwiper initialArticles={filteredArticles} />
}