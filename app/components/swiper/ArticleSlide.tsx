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
        <h1 className="font-bold text-gray-900 dark:text-gray-100 leading-tight responsive-title">
          {article.title}
        </h1>

        {article.subtitle && (
          <p className="text-gray-600 dark:text-gray-400 font-medium responsive-subtitle">
            {article.subtitle}
          </p>
        )}

        <div
          className="text-gray-700 dark:text-gray-300 leading-relaxed prose dark:prose-invert mx-auto max-w-none responsive-content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </div>
  )
}