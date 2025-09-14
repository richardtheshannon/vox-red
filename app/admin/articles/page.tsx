import Link from 'next/link'
import AdminLayout from '@/app/components/ui/AdminLayout'
import ArticlesList from '@/app/components/admin/ArticlesList'
import Button from '@/app/components/ui/Button'
import { prisma } from '@/app/lib/database'

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: { orderPosition: 'asc' },
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
          <Link href="/admin/articles/new">
            <Button>Create New Article</Button>
          </Link>
        </div>

        {articles.length > 0 ? (
          <>
            <p className="text-gray-600">
              Drag and drop articles to reorder them. The order here determines how they appear on the public site.
            </p>
            <ArticlesList initialArticles={articles} />
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">No articles yet</p>
            <Link href="/admin/articles/new">
              <Button>Create Your First Article</Button>
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}