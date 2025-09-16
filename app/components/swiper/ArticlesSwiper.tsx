'use client'

import { useEffect, useState, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Keyboard, Mousewheel } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import ArticleSlide from './ArticleSlide'
import HorizontalSlides from './HorizontalSlides'
import { useRealtime } from '@/app/hooks/useRealtime'

import 'swiper/css'
import 'swiper/css/pagination'

interface Article {
  id: string
  title: string
  subtitle?: string | null
  content: string
  orderPosition: number
  textAlign?: string
  verticalAlign?: string
  parentId?: string | null
  subArticles?: Article[]
}

interface ArticlesSwiperProps {
  initialArticles: Article[]
}

export default function ArticlesSwiper({ initialArticles }: ArticlesSwiperProps) {
  const [articles, setArticles] = useState(initialArticles)
  const [isLoading, setIsLoading] = useState(false)
  const { isConnected, refreshTrigger } = useRealtime()
  const swiperRef = useRef<SwiperType | null>(null)

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/articles')
        if (response.ok) {
          const updatedArticles = await response.json()
          setArticles(updatedArticles)
        }
      } catch (error) {
        console.error('Error fetching articles:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (refreshTrigger > 0) {
      fetchArticles()
    }
  }, [refreshTrigger])

  // Listen for home navigation event
  useEffect(() => {
    const handleNavigateToFirst = () => {
      if (swiperRef.current) {
        swiperRef.current.slideTo(0)
      }
    }

    window.addEventListener('navigateToFirstSlide', handleNavigateToFirst)

    return () => {
      window.removeEventListener('navigateToFirstSlide', handleNavigateToFirst)
    }
  }, [])

  if (articles.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Welcome</h1>
          <p className="text-gray-600 dark:text-gray-400">No articles available at the moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full relative">
      <Swiper
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        modules={[Pagination, Keyboard, Mousewheel]}
        direction="vertical"
        slidesPerView={1}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet bg-white bg-opacity-50',
          bulletActiveClass: 'swiper-pagination-bullet-active bg-white',
        }}
        keyboard={{
          enabled: true,
          onlyInViewport: true,
        }}
        mousewheel={true}
        speed={600}
        className="h-full w-full"
        style={{
          '--swiper-pagination-color': '#ffffff',
          '--swiper-pagination-bullet-inactive-color': '#ffffff',
          '--swiper-pagination-bullet-inactive-opacity': '0.5',
        } as React.CSSProperties}
      >
        {articles.map((article) => (
          <SwiperSlide key={article.id} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            {article.subArticles && article.subArticles.length > 0 ? (
              <HorizontalSlides
                mainArticle={article}
                subArticles={article.subArticles}
              />
            ) : (
              <ArticleSlide article={article} />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}