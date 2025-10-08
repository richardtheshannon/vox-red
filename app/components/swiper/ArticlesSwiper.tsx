'use client'

import { useEffect, useState, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Keyboard, Mousewheel } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import ArticleSlide from './ArticleSlide'
import HorizontalSlides from './HorizontalSlides'
import BottomNavigationFooter from '../BottomNavigationFooter'
import { useRealtime } from '@/app/hooks/useRealtime'

import 'swiper/css'

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
  articleType?: string | null
  pauseDuration?: number | null
  isChallenge?: boolean
  challengeDuration?: number | null
  challengeStartDate?: Date | string | null
  challengeEndDate?: Date | string | null
}

interface ArticlesSwiperProps {
  initialArticles: Article[]
}

export default function ArticlesSwiper({ initialArticles }: ArticlesSwiperProps) {
  const [articles, setArticles] = useState(initialArticles)
  const { refreshTrigger } = useRealtime()
  const swiperRef = useRef<SwiperType | null>(null)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('/api/articles')
        if (response.ok) {
          const updatedArticles = await response.json()
          setArticles(updatedArticles)
        }
      } catch (error) {
        console.error('Error fetching articles:', error)
      }
    }

    if (refreshTrigger > 0) {
      fetchArticles()
    }
  }, [refreshTrigger])

  // Vertical navigation functions (infinite loop)
  const goToPrevious = () => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev()
    }
  }

  const goToNext = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext()
    }
  }

  // Horizontal navigation functions
  const goToHorizontalPrevious = () => {
    window.dispatchEvent(new CustomEvent('horizontalSlidePrevious'))
  }

  const goToHorizontalNext = () => {
    window.dispatchEvent(new CustomEvent('horizontalSlideNext'))
  }

  // Listen for navigation events
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

  // Auto-row-play handles MP3 playback within rows, no cross-slide navigation

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
      {/* Home Icon - Top Left Corner */}
      <button
        onClick={() => {
          if (swiperRef.current) {
            swiperRef.current.slideTo(0)
          }
        }}
        className="fixed top-6 left-6 z-50 w-8 h-8 flex items-center justify-center transition-all duration-200 group"
        aria-label="Go to first slide"
      >
        <img
          src="/media/icon-96x96.png"
          alt="Home"
          className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity duration-200"
        />
      </button>

      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
        onSlideChange={(swiper) => {
          console.log('ArticlesSwiper: Slide changed to index:', swiper.activeIndex)
        }}
        modules={[Keyboard, Mousewheel]}
        direction="vertical"
        slidesPerView={1}
        loop={true}
        keyboard={{
          enabled: true,
          onlyInViewport: true,
        }}
        mousewheel={true}
        speed={600}
        className="h-full w-full"
      >
        {articles.map((article, index) => {
          const content = article.subArticles && article.subArticles.length > 0 ? (
            <HorizontalSlides
              mainArticle={article}
              subArticles={article.subArticles}
              slideIndex={index}
            />
          ) : (
            <ArticleSlide
              article={article}
              showAutoRowPlay={true}
            />
          )

          // Only render SwiperSlide if content is not null
          return content ? (
            <SwiperSlide key={article.id}>
              {content}
            </SwiperSlide>
          ) : null
        }).filter(Boolean)}
      </Swiper>

      <BottomNavigationFooter
        onVerticalPrevious={goToPrevious}
        onVerticalNext={goToNext}
        onHorizontalPrevious={goToHorizontalPrevious}
        onHorizontalNext={goToHorizontalNext}
      />
    </div>
  )
}