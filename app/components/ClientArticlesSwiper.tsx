'use client'

import dynamic from 'next/dynamic'
import LoadingSpinner from './ui/LoadingSpinner'

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
}

interface ClientArticlesSwiperProps {
  initialArticles: Article[]
}

export default function ClientArticlesSwiper({ initialArticles }: ClientArticlesSwiperProps) {
  return <ArticlesSwiper initialArticles={initialArticles} />
}