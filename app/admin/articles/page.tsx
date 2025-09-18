import AdminLayout from '@/app/components/ui/AdminLayout'
import ArticlesPageClient from './ArticlesPageClient'
import { prisma } from '@/app/lib/database'

export const dynamic = 'force-dynamic'

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    where: { parentId: null }, // Only get main articles
    orderBy: { orderPosition: 'asc' },
    select: {
      id: true,
      title: true,
      subtitle: true,
      orderPosition: true,
      updatedAt: true,
      parentId: true,
      published: true,
      isProject: true,
      publishTimeStart: true,
      publishTimeEnd: true,
      publishDays: true,
      subArticles: {
        orderBy: { orderPosition: 'asc' },
        select: {
          id: true,
          title: true,
          subtitle: true,
          orderPosition: true,
          updatedAt: true,
          parentId: true,
          published: true,
          isProject: true,
          publishTimeStart: true,
          publishTimeEnd: true,
          publishDays: true
        }
      }
    }
  })

  return (
    <AdminLayout>
      <ArticlesPageClient initialArticles={articles} />
    </AdminLayout>
  )
}