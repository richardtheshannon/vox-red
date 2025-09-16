'use client'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Keyboard, Mousewheel } from 'swiper/modules'
import ArticleSlide from './ArticleSlide'

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

interface HorizontalSlidesProps {
  mainArticle: Article
  subArticles: Article[]
}

export default function HorizontalSlides({ mainArticle, subArticles }: HorizontalSlidesProps) {
  const allSlides = [mainArticle, ...subArticles]

  if (allSlides.length === 1) {
    // If no sub-articles, just show the main article without swiper
    return <ArticleSlide article={mainArticle} />
  }

  return (
    <Swiper
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
      {allSlides.map((article) => (
        <SwiperSlide key={article.id}>
          <ArticleSlide article={article} />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}