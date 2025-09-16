import { prisma } from '@/app/lib/database'
import ClientArticlesSwiper from './components/ClientArticlesSwiper'

export const dynamic = 'force-dynamic'

export default async function Home() {
  // Get published articles
  const publishedArticles = await prisma.article.findMany({
    where: {
      parentId: null, // Only get main articles
      published: true // Only get published articles
    },
    orderBy: { orderPosition: 'asc' },
    include: {
      subArticles: {
        where: { published: true }, // Only include published sub-articles
        orderBy: { orderPosition: 'asc' }
      }
    }
  })

  // Also get completed projects (unpublished projects with no published sub-articles)
  const completedProjects = await prisma.article.findMany({
    where: {
      parentId: null,
      isProject: true,
      published: false
    },
    orderBy: { orderPosition: 'asc' },
    include: {
      subArticles: {
        where: { published: true },
        orderBy: { orderPosition: 'asc' }
      }
    }
  })

  // Filter to only include truly completed projects (no published sub-articles)
  const fullyCompletedProjects = completedProjects.filter(
    project => project.subArticles.length === 0
  )

  // Combine and sort by orderPosition
  const allArticles = [...publishedArticles, ...fullyCompletedProjects].sort(
    (a, b) => a.orderPosition - b.orderPosition
  )

  return <ClientArticlesSwiper initialArticles={allArticles} />
}
