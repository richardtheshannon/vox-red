import { auth } from '@/app/lib/auth'
import { prisma } from '@/app/lib/database'
import AdminLayout from '@/app/components/ui/AdminLayout'
import Link from 'next/link'
import Button from '@/app/components/ui/Button'
import BackgroundMusicSettings from '@/app/components/admin/BackgroundMusicSettings'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  
  const articleCount = await prisma.article.count()
  const recentArticles = await prisma.article.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Welcome back, {session?.user?.email}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Total Articles</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{articleCount}</p>
              <Link href="/admin/articles" className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                View all →
              </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Quick Actions</h3>
              <div className="mt-4 space-y-2">
                <Link href="/admin/articles/new">
                  <Button className="w-full" size="sm">
                    Create New Article
                  </Button>
                </Link>
                <Link href="/admin/articles">
                  <Button variant="secondary" className="w-full" size="sm">
                    Manage Articles
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Site Status</h3>
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                  Active
                </span>
                <Link href="/" target="_blank" className="mt-2 block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  View public site →
                </Link>
              </div>
            </div>
          </div>

          <BackgroundMusicSettings />

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Articles</h2>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {recentArticles.length > 0 ? (
                recentArticles.map((article) => (
                  <div key={article.id} className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{article.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Updated {new Date(article.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link href={`/admin/articles/${article.id}/edit`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="px-6 py-4 text-gray-500 dark:text-gray-400">No articles yet</p>
              )}
            </div>
          </div>
      </div>
    </AdminLayout>
  )
}