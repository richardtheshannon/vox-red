'use client'

import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Keyboard, Mousewheel } from 'swiper/modules'
import ArticleSlide from './ArticleSlide'
import { useRealtime } from '@/app/hooks/useRealtime'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface Article {
  id: string
  title: string
  subtitle?: string | null
  content: string
  orderPosition: number
}

interface ArticlesSwiperProps {
  initialArticles: Article[]
}

export default function ArticlesSwiper({ initialArticles }: ArticlesSwiperProps) {
  const [articles, setArticles] = useState(initialArticles)
  const [isLoading, setIsLoading] = useState(false)
  const { isConnected, refreshTrigger } = useRealtime()

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

  if (articles.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome</h1>
          <p className="text-gray-600">No articles available at the moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full relative">
      {/* Connection Status */}
      <div className="absolute top-4 right-4 z-50 space-y-2">
        <div className={`px-3 py-1 rounded-full text-sm ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '🟢 Live' : '🔴 Disconnected'}
        </div>
        
        {isLoading && (
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            Updating content...
          </div>
        )}
      </div>
      
      <Swiper
        modules={[Navigation, Pagination, Keyboard, Mousewheel]}
        direction="vertical"
        slidesPerView={1}
        navigation={true}
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
          '--swiper-navigation-color': '#374151',
          '--swiper-navigation-size': '24px',
          '--swiper-pagination-color': '#ffffff',
          '--swiper-pagination-bullet-inactive-color': '#ffffff',
          '--swiper-pagination-bullet-inactive-opacity': '0.5',
        } as React.CSSProperties}
      >
        {articles.map((article) => (
          <SwiperSlide key={article.id} className="bg-gradient-to-br from-gray-50 to-gray-100">
            <ArticleSlide article={article} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Admin link */}
      <div className="absolute top-4 left-4 z-50">
        <a
          href="/admin/login"
          className="bg-black bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Admin
        </a>
      </div>
    </div>
  )
}