'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Keyboard, Mousewheel } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import ArticleSlide from './ArticleSlide'
import ChallengeSlide from '../challenge/ChallengeSlide'
import AutoRowPlayButton from '../AutoRowPlayButton'
import { shouldShowArticle } from '@/app/lib/publishingUtils'

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
  isProject: boolean
  published: boolean
  isFavorite?: boolean
  temporarilyUnpublished?: boolean
  articleType?: string | null
  pauseDuration?: number | null
  publishTimeStart?: string | null
  publishTimeEnd?: string | null
  publishDays?: string | null
  isChallenge?: boolean
  challengeDuration?: number | null
  challengeStartDate?: Date | string | null
  challengeEndDate?: Date | string | null
}

interface HorizontalSlidesProps {
  mainArticle: Article
  subArticles: Article[]
  slideIndex?: number // Made optional since it's not used
}

export default function HorizontalSlides({ mainArticle, subArticles }: HorizontalSlidesProps) {
  const [visibleSlides, setVisibleSlides] = useState<Article[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [audioTracks, setAudioTracks] = useState<Array<{
    url: string
    title: string
    articleId: string
    slideIndex: number
  }>>([])
  const swiperRef = useRef<SwiperType | null>(null)
  // Track current slide's scroll state to control mousewheel behavior
  const [currentSlideScrollState, setCurrentSlideScrollState] = useState({
    hasOverflow: false,
    isAtBottom: true,
    isAtTop: true
  })

  const fetchCompletedExercises = useCallback(async () => {
    try {
      const response = await fetch(`/api/challenges/${mainArticle.id}/progress`)
      if (response.ok) {
        const data = await response.json()
        setCompletedExercises(data.todayCompleted || [])
      }
    } catch (error) {
      console.error('Error fetching challenge progress:', error)
    }
  }, [mainArticle.id])

  // Fetch completed exercises if this is a challenge
  useEffect(() => {
    if (mainArticle.isChallenge) {
      fetchCompletedExercises()
    }
  }, [mainArticle.isChallenge, fetchCompletedExercises])

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
    // Initialize visible slides - only show articles that pass shouldShowArticle check
    if (mainArticle.isProject) {
      const slides = []
      if (shouldShowArticle(mainArticle)) {
        slides.push(mainArticle)
      }
      // Add sub-articles that pass visibility checks
      const visibleSubArticles = subArticles.filter(sub => shouldShowArticle(sub))
      slides.push(...visibleSubArticles)
      setVisibleSlides(slides)
    } else {
      // Non-project articles show slides that pass visibility checks
      const slides = []

      // For challenges, ALWAYS show the main article even if shouldShowArticle returns false
      if (mainArticle.isChallenge || shouldShowArticle(mainArticle)) {
        slides.push(mainArticle)
      }

      // Add sub-articles that pass visibility checks
      const visibleSubArticles = subArticles.filter(sub => shouldShowArticle(sub))
      slides.push(...visibleSubArticles)
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

  // Add comprehensive event interceptors
  useEffect(() => {
    const { hasOverflow, isAtBottom } = currentSlideScrollState
    const shouldBlockNavigation = hasOverflow && !isAtBottom

    const handleWheel = (e: WheelEvent) => {
      // If content has overflow and is not at bottom, prevent horizontal scrolling
      if (hasOverflow && !isAtBottom && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        // Let vertical scrolling happen in article-scroll div
        return
      }

      if (hasOverflow && !isAtBottom && Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
        // Prevent horizontal scroll when content needs vertical scrolling
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (shouldBlockNavigation) {
        // Store initial touch position to determine swipe direction
        const touch = e.touches[0]
        if (touch) {
          ;(e.target as any)._touchStartX = touch.clientX
          ;(e.target as any)._touchStartY = touch.clientY
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (shouldBlockNavigation) {
        const touch = e.touches[0]
        const target = e.target as any
        if (touch && target._touchStartX !== undefined && target._touchStartY !== undefined) {
          const deltaX = Math.abs(touch.clientX - target._touchStartX)
          const deltaY = Math.abs(touch.clientY - target._touchStartY)

          // If horizontal swipe is more significant than vertical, block it
          if (deltaX > deltaY && deltaX > 20) {
            e.preventDefault()
            e.stopPropagation()
          }
        }
      }
    }

    // Add capture phase listeners to intercept before Swiper
    document.addEventListener('wheel', handleWheel, { passive: false, capture: true })
    document.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true })

    return () => {
      document.removeEventListener('wheel', handleWheel, { capture: true })
      document.removeEventListener('touchstart', handleTouchStart, { capture: true })
      document.removeEventListener('touchmove', handleTouchMove, { capture: true })
    }
  }, [currentSlideScrollState])

  const handleScrollStatusChange = useCallback((hasOverflow: boolean, isAtBottom: boolean, isAtTop: boolean) => {
    setCurrentSlideScrollState({ hasOverflow, isAtBottom, isAtTop })


    // Update swiper's behavior based on scroll state
    if (swiperRef.current) {
      if (hasOverflow && !isAtBottom) {
        // Disable ALL horizontal navigation when content needs to scroll down
        swiperRef.current.allowTouchMove = false
        swiperRef.current.allowSlideNext = false
        swiperRef.current.allowSlidePrev = true // Allow going back
        if (swiperRef.current.mousewheel) {
          swiperRef.current.mousewheel.disable()
        }
      } else {
        // Enable ALL horizontal navigation when content is fully scrolled or no overflow
        swiperRef.current.allowTouchMove = true
        swiperRef.current.allowSlideNext = true
        swiperRef.current.allowSlidePrev = true
        if (swiperRef.current.mousewheel) {
          swiperRef.current.mousewheel.enable()
        }
      }
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


  if (visibleSlides.length === 1) {
    // If only one slide, show it without swiper but with auto-row-play button
    const slide = visibleSlides[0]
    const isMainSlide = slide.id === mainArticle.id

    // If this is a challenge main slide, show the challenge progress
    if (mainArticle.isChallenge && isMainSlide) {
      return (
        <>
          <AutoRowPlayButton audioTracks={audioTracks} pauseDuration={mainArticle.pauseDuration} />
          <ChallengeSlide
            article={{
              ...slide,
              articleType: slide.articleType || mainArticle.articleType,
              challengeDuration: mainArticle.challengeDuration,
              challengeStartDate: mainArticle.challengeStartDate,
              challengeEndDate: mainArticle.challengeEndDate
            }}
          />
        </>
      )
    }

    return (
      <>
        <AutoRowPlayButton audioTracks={audioTracks} pauseDuration={mainArticle.pauseDuration} />
        <ArticleSlide
          article={{
            ...slide,
            // Sub-articles inherit the parent's articleType
            articleType: slide.articleType || mainArticle.articleType
          }}
          onComplete={handleSlideComplete}
          onScrollStatusChange={handleScrollStatusChange}
          isInChallenge={mainArticle.isChallenge}
          challengeId={mainArticle.id}
          isCompleted={completedExercises.includes(slide.id)}
        />
      </>
    )
  }

  // Show challenge stats when legitimately completed (only for challenges)
  if (isCompleted && mainArticle.isChallenge) {
    return (
      <>
        <AutoRowPlayButton audioTracks={[]} pauseDuration={mainArticle.pauseDuration} />
        <ChallengeSlide
          article={{
            ...mainArticle,
            challengeDuration: mainArticle.challengeDuration,
            challengeStartDate: mainArticle.challengeStartDate,
            challengeEndDate: mainArticle.challengeEndDate
          }}
        />
      </>
    )
  }

  if (visibleSlides.length === 0) {
    // For challenges, only show if main challenge article should be visible and not completed
    if (mainArticle.isChallenge && !isCompleted && shouldShowArticle(mainArticle)) {
      return (
        <>
          <AutoRowPlayButton audioTracks={[]} pauseDuration={mainArticle.pauseDuration} />
          <ChallengeSlide
            article={{
              ...mainArticle,
              challengeDuration: mainArticle.challengeDuration,
              challengeStartDate: mainArticle.challengeStartDate,
              challengeEndDate: mainArticle.challengeEndDate
            }}
          />
        </>
      )
    }
    // For all other cases (standard articles, projects, unpublished rows), return null
    return null
  }

  return (
    <>
      <AutoRowPlayButton audioTracks={audioTracks} pauseDuration={mainArticle.pauseDuration} />


      <Swiper
      onSwiper={(swiper) => {
        swiperRef.current = swiper
        // Start with navigation enabled, but it will be controlled by scroll status
        swiper.allowTouchMove = true
        swiper.allowSlideNext = true
        swiper.allowSlidePrev = true

        // Force check of current slide's scroll status after swiper is ready
        setTimeout(() => {
          if (currentSlideScrollState.hasOverflow && !currentSlideScrollState.isAtBottom) {
            swiper.allowTouchMove = false
            swiper.allowSlideNext = false
            swiper.allowSlidePrev = true
            if (swiper.mousewheel) {
              swiper.mousewheel.disable()
            }
          }
        }, 200)
      }}
      onSlideChange={() => {
        // Reset scroll state when slide changes - default to allowing navigation
        setCurrentSlideScrollState({ hasOverflow: false, isAtBottom: true, isAtTop: true })
        // Re-enable all navigation temporarily (will be updated by the new slide's scroll status)
        if (swiperRef.current) {
          swiperRef.current.allowTouchMove = true
          swiperRef.current.allowSlideNext = true
          swiperRef.current.allowSlidePrev = true
          if (swiperRef.current.mousewheel) {
            swiperRef.current.mousewheel.enable()
          }
        }
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
      {visibleSlides.map((article) => {
        const isMainSlide = article.id === mainArticle.id

        // For challenge rows, show ChallengeSlide for main slide, ArticleSlide for exercises
        if (mainArticle.isChallenge && isMainSlide) {
          return (
            <SwiperSlide key={article.id}>
              <ChallengeSlide
                article={{
                  ...article,
                  articleType: article.articleType || mainArticle.articleType,
                  challengeDuration: mainArticle.challengeDuration,
                  challengeStartDate: mainArticle.challengeStartDate,
                  challengeEndDate: mainArticle.challengeEndDate
                }}
              />
            </SwiperSlide>
          )
        }

        return (
          <SwiperSlide key={article.id}>
            <ArticleSlide
              article={{
                ...article,
                // Sub-articles inherit the parent's articleType
                articleType: article.articleType || mainArticle.articleType
              }}
              onComplete={handleSlideComplete}
              onScrollStatusChange={handleScrollStatusChange}
              isInChallenge={mainArticle.isChallenge}
              challengeId={mainArticle.id}
              isCompleted={completedExercises.includes(article.id)}
            />
          </SwiperSlide>
        )
      })}
    </Swiper>
    </>
  )
}