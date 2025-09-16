import { notFound } from 'next/navigation'
import AdminLayout from '@/app/components/ui/AdminLayout'
import ArticleForm from '@/app/components/admin/ArticleForm'
import { prisma } from '@/app/lib/database'

export const dynamic = 'force-dynamic'

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const article = await prisma.article.findUnique({
    where: { id },
  })

  if (!article) {
    notFound()
  }

  // Get all articles for parent selection dropdown
  const allArticles = await prisma.article.findMany({
    where: { parentId: null },
    select: { id: true, title: true, parentId: true },
  })

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Article</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <ArticleForm article={article} allArticles={allArticles} />
        </div>
      </div>
    </AdminLayout>
  )
}