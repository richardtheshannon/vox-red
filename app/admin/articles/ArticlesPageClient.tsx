'use client'

import { useState } from 'react'
import Link from 'next/link'
import ArticlesList from '@/app/components/admin/ArticlesList'
import Button from '@/app/components/ui/Button'
import ImportProjectModal from '@/app/components/admin/ImportProjectModal'
import { useRouter } from 'next/navigation'

type ArticleListItem = {
  id: string
  title: string
  subtitle: string | null
  orderPosition: number
  updatedAt: Date
  parentId: string | null
  published: boolean
  isProject: boolean
  isFavorite?: boolean
  temporarilyUnpublished?: boolean
  articleType?: string | null
  pauseDuration?: number | null
  subArticles: {
    id: string
    title: string
    subtitle: string | null
    orderPosition: number
    updatedAt: Date
    parentId: string | null
    published: boolean
    isProject: boolean
    isFavorite?: boolean
    temporarilyUnpublished?: boolean
    articleType?: string | null
    pauseDuration?: number | null
  }[]
}

interface ArticlesPageClientProps {
  initialArticles: ArticleListItem[]
}

export default function ArticlesPageClient({ initialArticles }: ArticlesPageClientProps) {
  const [showImportModal, setShowImportModal] = useState(false)
  const router = useRouter()

  const handleImportSuccess = () => {
    // Refresh the page to show new articles
    router.refresh()
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Articles</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Link href="/admin/media">
              <Button className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base">
                Media Manager
              </Button>
            </Link>
            <Button
              onClick={() => setShowImportModal(true)}
              className="bg-green-600 hover:bg-green-700 text-sm sm:text-base"
            >
              Import Project
            </Button>
            <Link href="/admin/articles/new">
              <Button className="text-sm sm:text-base">Create New Article</Button>
            </Link>
          </div>
        </div>

        {initialArticles.length > 0 ? (
          <>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Drag and drop articles to reorder them. The order here determines how they appear on the public site.
            </p>
            <ArticlesList initialArticles={initialArticles} />
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sm:p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No articles yet</p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
              <Link href="/admin/media">
                <Button className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base">
                  Media Manager
                </Button>
              </Link>
              <Button
                onClick={() => setShowImportModal(true)}
                className="bg-green-600 hover:bg-green-700 text-sm sm:text-base"
              >
                Import Project
              </Button>
              <Link href="/admin/articles/new">
                <Button className="text-sm sm:text-base">Create Your First Article</Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <ImportProjectModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </>
  )
}