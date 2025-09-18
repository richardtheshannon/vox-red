'use client'

import { useEffect, useState, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Keyboard, Mousewheel } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import ArticleSlide from './ArticleSlide'
import HorizontalSlides from './HorizontalSlides'
import { useRealtime } from '@/app/hooks/useRealtime'
import { useAutoPlay } from '../AutoPlayManager'

import 'swiper/css'
import 'swiper/css/pagination'

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

interface ArticlesSwiperProps {
  initialArticles: Article[]
}

export default function ArticlesSwiper({ initialArticles }: ArticlesSwiperProps) {
  const [articles, setArticles] = useState(initialArticles)
  const { refreshTrigger } = useRealtime()
  const { isAutoPlaying, currentSlideIndex, setCurrentPosition } = useAutoPlay()
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

  // Auto-play navigation event listeners
  useEffect(() => {
    const handleAutoPlayNext = (event: CustomEvent) => {
      const { currentSlideIndex: slideIndex, currentSubSlideIndex: subSlideIndex } = event.detail

      // Check if current slide has sub-articles
      const currentArticle = articles[slideIndex]
      if (currentArticle && currentArticle.subArticles && currentArticle.subArticles.length > 0) {
        // Let HorizontalSlides handle the navigation within sub-articles
        window.dispatchEvent(new CustomEvent('autoPlayNextHorizontal', {
          detail: { slideIndex, subSlideIndex }
        }))
      } else {
        // Move to next main slide
        const nextSlideIndex = slideIndex + 1
        if (nextSlideIndex < articles.length) {
          if (swiperRef.current) {
            swiperRef.current.slideTo(nextSlideIndex)
            setCurrentPosition(nextSlideIndex, 0)
            window.dispatchEvent(new CustomEvent('autoPlaySlideChange', {
              detail: { slideIndex: nextSlideIndex, subSlideIndex: 0 }
            }))
          }
        } else {
          // End of slides - reset auto-play
          window.dispatchEvent(new CustomEvent('autoPlayReset'))
          if (swiperRef.current) {
            swiperRef.current.slideTo(0)
            setCurrentPosition(0, 0)
          }
        }
      }
    }

    const handleAutoPlayReset = () => {
      if (swiperRef.current) {
        swiperRef.current.slideTo(0)
        setCurrentPosition(0, 0)
      }
    }

    window.addEventListener('autoPlayNext', handleAutoPlayNext as EventListener)
    window.addEventListener('autoPlayReset', handleAutoPlayReset)

    return () => {
      window.removeEventListener('autoPlayNext', handleAutoPlayNext as EventListener)
      window.removeEventListener('autoPlayReset', handleAutoPlayReset)
    }
  }, [articles, setCurrentPosition])

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
        {articles.map((article, index) => (
          <SwiperSlide key={article.id} className="bg-gray-50 dark:bg-[#141414]">
            {article.subArticles && article.subArticles.length > 0 ? (
              <HorizontalSlides
                mainArticle={article}
                subArticles={article.subArticles}
                slideIndex={index}
                isAutoPlaying={isAutoPlaying}
              />
            ) : (
              <ArticleSlide
                article={article}
                isAutoPlaying={isAutoPlaying && currentSlideIndex === index}
              />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}