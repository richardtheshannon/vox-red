'use client'

interface ArticleSlideProps {
  article: {
    id: string
    title: string
    subtitle?: string | null
    content: string
  }
}

export default function ArticleSlide({ article }: ArticleSlideProps) {
  return (
    <div className="h-full flex flex-col justify-center items-center p-6 md:p-12">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
          {article.title}
        </h1>
        
        {article.subtitle && (
          <p className="text-lg md:text-xl lg:text-2xl text-gray-600 font-medium">
            {article.subtitle}
          </p>
        )}
        
        <div 
          className="text-base md:text-lg text-gray-700 leading-relaxed prose prose-lg mx-auto max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </div>
  )
}