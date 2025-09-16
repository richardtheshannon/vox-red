'use client'

import { useState } from 'react'
import Link from 'next/link'
import ArticlesList from '@/app/components/admin/ArticlesList'
import Button from '@/app/components/ui/Button'
import ImportProjectModal from '@/app/components/admin/ImportProjectModal'
import { useRouter } from 'next/navigation'
import type { Article } from '@prisma/client'

interface ArticlesPageClientProps {
  initialArticles: (Article & { subArticles?: Article[] })[]
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowImportModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Import Project
            </Button>
            <Link href="/admin/articles/new">
              <Button>Create New Article</Button>
            </Link>
          </div>
        </div>

        {initialArticles.length > 0 ? (
          <>
            <p className="text-gray-600">
              Drag and drop articles to reorder them. The order here determines how they appear on the public site.
            </p>
            <ArticlesList initialArticles={initialArticles} />
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">No articles yet</p>
            <div className="flex justify-center space-x-3">
              <Button
                onClick={() => setShowImportModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                Import Project
              </Button>
              <Link href="/admin/articles/new">
                <Button>Create Your First Article</Button>
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