import { prisma } from '@/app/lib/database'
import ClientArticlesSwiper from './components/ClientArticlesSwiper'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const articles = await prisma.article.findMany({
    where: { parentId: null }, // Only get main articles
    orderBy: { orderPosition: 'asc' },
    include: {
      subArticles: {
        orderBy: { orderPosition: 'asc' }
      }
    }
  })

  return <ClientArticlesSwiper initialArticles={articles} />
}
