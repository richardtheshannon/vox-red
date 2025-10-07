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
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [horizontalNavState, setHorizontalNavState] = useState({
    canGoPrevious: false,
    canGoNext: false,
    hasHorizontalSlides: false
  })
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

  // Vertical navigation functions
  const goToPrevious = () => {
    if (swiperRef.current && currentSlideIndex > 0) {
      swiperRef.current.slideTo(currentSlideIndex - 1)
    }
  }

  const goToNext = () => {
    if (swiperRef.current && currentSlideIndex < articles.length - 1) {
      swiperRef.current.slideTo(currentSlideIndex + 1)
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

    const handleHorizontalNavigationState = (event: CustomEvent) => {
      const { canGoPrevious, canGoNext, hasHorizontalSlides } = event.detail
      setHorizontalNavState({
        canGoPrevious,
        canGoNext,
        hasHorizontalSlides
      })
    }

    window.addEventListener('navigateToFirstSlide', handleNavigateToFirst)
    window.addEventListener('horizontalNavigationState', handleHorizontalNavigationState as EventListener)

    return () => {
      window.removeEventListener('navigateToFirstSlide', handleNavigateToFirst)
      window.removeEventListener('horizontalNavigationState', handleHorizontalNavigationState as EventListener)
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
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
        onSlideChange={(swiper) => {
          const activeIndex = swiper.activeIndex
          setCurrentSlideIndex(activeIndex)
          console.log('ArticlesSwiper: Slide changed to index:', activeIndex)
        }}
        modules={[Keyboard, Mousewheel]}
        direction="vertical"
        slidesPerView={1}
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
        canGoVerticalPrevious={currentSlideIndex > 0}
        canGoVerticalNext={currentSlideIndex < articles.length - 1}
        onHorizontalPrevious={goToHorizontalPrevious}
        onHorizontalNext={goToHorizontalNext}
        canGoHorizontalPrevious={horizontalNavState.canGoPrevious}
        canGoHorizontalNext={horizontalNavState.canGoNext}
      />
    </div>
  )
}