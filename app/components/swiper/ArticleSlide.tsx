'use client'

interface ArticleSlideProps {
  article: {
    id: string
    title: string
    subtitle?: string | null
    content: string
    textAlign?: string
    verticalAlign?: string
  }
}

export default function ArticleSlide({ article }: ArticleSlideProps) {
  const textAlign = article.textAlign || 'left'
  const verticalAlign = article.verticalAlign || 'center'

  // Determine vertical alignment classes
  const getVerticalAlignClasses = () => {
    switch (verticalAlign) {
      case 'top':
        return 'justify-start'
      case 'bottom':
        return 'justify-end'
      default:
        return 'justify-center'
    }
  }

  // Determine text alignment classes
  const getTextAlignClasses = () => {
    switch (textAlign) {
      case 'right':
        return 'text-right'
      default:
        return 'text-left'
    }
  }

  return (
    <div className={`h-full flex flex-col ${getVerticalAlignClasses()} p-4 sm:p-6 md:p-8 lg:p-12`}>
      <div className={`w-full ${getTextAlignClasses()} space-y-4 sm:space-y-6`}>
        <h1 className="font-bold text-gray-900 dark:text-gray-100 responsive-title">
          {article.title}
        </h1>

        {article.subtitle && (
          <p className="text-gray-600 dark:text-gray-400 font-medium responsive-subtitle">
            {article.subtitle}
          </p>
        )}

        <div
          className={`text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none responsive-content ${textAlign === 'right' ? 'prose-headings:text-right prose-p:text-right' : 'prose-headings:text-left prose-p:text-left'}`}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </div>
  )
}