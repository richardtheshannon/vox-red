'use client'

import { useState, useRef, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Keyboard, Mousewheel } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import ArticleSlide from './ArticleSlide'
import AutoRowPlayButton from '../AutoRowPlayButton'

import 'swiper/css'
import 'swiper/css/pagination'

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
  isProject?: boolean
  published?: boolean
  isFavorite?: boolean
  articleType?: string | null
  pauseDuration?: number | null
}

interface HorizontalSlidesProps {
  mainArticle: Article
  subArticles: Article[]
  slideIndex?: number // Made optional since it's not used
}

export default function HorizontalSlides({ mainArticle, subArticles }: HorizontalSlidesProps) {
  const [visibleSlides, setVisibleSlides] = useState<Article[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [audioTracks, setAudioTracks] = useState<Array<{
    url: string
    title: string
    articleId: string
    slideIndex: number
  }>>([])
  const swiperRef = useRef<SwiperType | null>(null)

  // Update audio tracks whenever visible slides change
  useEffect(() => {
    const tracks: Array<{
      url: string
      title: string
      articleId: string
      slideIndex: number
    }> = []

    // Map through visible slides and add audio tracks with correct slide indices
    visibleSlides.forEach((slide, index) => {
      if (slide.audioUrl) {
        tracks.push({
          url: slide.audioUrl,
          title: slide.title,
          articleId: slide.id,
          slideIndex: index // Use actual visible slide index
        })
      }
    })

    setAudioTracks(tracks)
  }, [visibleSlides])

  useEffect(() => {
    // Initialize visible slides - only show published articles
    if (mainArticle.isProject) {
      const slides = []
      if (mainArticle.published) {
        slides.push(mainArticle)
      }
      // Always add published sub-articles
      const publishedSubArticles = subArticles.filter(sub => sub.published)
      slides.push(...publishedSubArticles)
      setVisibleSlides(slides)

      // Check if project is completed (no visible slides at all)
      if (slides.length === 0) {
        setIsCompleted(true)
      }
    } else {
      // Non-project articles show only published slides
      const slides = []
      if (mainArticle.published) {
        slides.push(mainArticle)
      }
      // Add published sub-articles
      const publishedSubArticles = subArticles.filter(sub => sub.published)
      slides.push(...publishedSubArticles)
      setVisibleSlides(slides)
    }
  }, [mainArticle, subArticles])

  // Listen for horizontal navigation event from auto-play
  useEffect(() => {
    const handleNavigateToHorizontalSlide = (event: CustomEvent) => {
      const { horizontalIndex } = event.detail
      console.log(`HorizontalSlides: Navigating to horizontal slide ${horizontalIndex}`)

      if (swiperRef.current) {
        swiperRef.current.slideTo(horizontalIndex)
      }
    }

    window.addEventListener('navigateToHorizontalSlide', handleNavigateToHorizontalSlide as EventListener)

    return () => {
      window.removeEventListener('navigateToHorizontalSlide', handleNavigateToHorizontalSlide as EventListener)
    }
  }, [])

  const handleSlideComplete = async (articleId: string) => {
    try {
      const response = await fetch('/api/articles/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.allCompleted) {
          setIsCompleted(true)
          setVisibleSlides([])
        } else {
          // Remove the completed slide
          setVisibleSlides(prev => {
            const newSlides = prev.filter(slide => slide.id !== articleId)

            // If we removed a slide and swiper needs to adjust
            if (swiperRef.current && newSlides.length > 0) {
              const currentIndex = prev.findIndex(s => s.id === articleId)
              // Move to the slide that's now at this index (or the last one if we're at the end)
              const nextIndex = Math.min(currentIndex, newSlides.length - 1)
              setTimeout(() => {
                swiperRef.current?.slideTo(nextIndex, 0)
              }, 0)
            }

            return newSlides
          })

          // If there's a next article that needs to be published, add it
          if (data.nextArticleId) {
            // The API already published it, we just need to refresh to get it
            // But since we want to avoid refresh, we'll handle it differently
            // For now, we're removing the current slide which should show the next one
          }
        }
      }
    } catch (error) {
      console.error('Error completing slide:', error)
    }
  }

  // Check if this is a completed project
  if (isCompleted) {
    return (
      <div className="h-full flex flex-col justify-center items-center p-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-green-600 dark:text-green-400">
            ✓ Project Completed!
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            All slides in &ldquo;{mainArticle.title}&rdquo; have been completed.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            This project has been successfully finished.
          </p>
        </div>
      </div>
    )
  }

  if (visibleSlides.length === 1) {
    // If only one slide, show it without swiper but with auto-row-play button
    return (
      <>
        <AutoRowPlayButton audioTracks={audioTracks} pauseDuration={mainArticle.pauseDuration} />
        <ArticleSlide
          article={{
            ...visibleSlides[0],
            // Sub-articles inherit the parent's articleType
            articleType: visibleSlides[0].articleType || mainArticle.articleType
          }}
          onComplete={handleSlideComplete}
        />
      </>
    )
  }

  if (visibleSlides.length === 0) {
    return null
  }

  return (
    <>
      <AutoRowPlayButton audioTracks={audioTracks} pauseDuration={mainArticle.pauseDuration} />
      <Swiper
      onSwiper={(swiper) => {
        swiperRef.current = swiper
        // Swiper initialized
      }}
      onSlideChange={() => {
        // Slide change handling removed for simplified auto-play
      }}
      modules={[Pagination, Keyboard, Mousewheel]}
      direction="horizontal"
      slidesPerView={1}
      pagination={{
        clickable: true,
        dynamicBullets: true,
        horizontalClass: 'swiper-pagination-horizontal',
        bulletClass: 'swiper-pagination-bullet',
        bulletActiveClass: 'swiper-pagination-bullet-active',
      }}
      keyboard={{
        enabled: true,
        onlyInViewport: true,
      }}
      mousewheel={{
        forceToAxis: true,
        sensitivity: 1,
        thresholdDelta: 70,
        thresholdTime: 300,
      }}
      speed={400}
      nested={true}
      className="h-full w-full"
      style={{
        '--swiper-pagination-color': '#ffffff',
        '--swiper-pagination-bullet-inactive-color': '#ffffff',
        '--swiper-pagination-bullet-inactive-opacity': '0.3',
        '--swiper-pagination-bottom': '40px',
      } as React.CSSProperties}
    >
      {visibleSlides.map((article) => (
        <SwiperSlide key={article.id}>
          <ArticleSlide
            article={{
              ...article,
              // Sub-articles inherit the parent's articleType
              articleType: article.articleType || mainArticle.articleType
            }}
            onComplete={handleSlideComplete}
          />
        </SwiperSlide>
      ))}
    </Swiper>
    </>
  )
}