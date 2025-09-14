import { prisma } from '@/app/lib/database'
import ClientArticlesSwiper from './components/ClientArticlesSwiper'

export default async function Home() {
  const articles = await prisma.article.findMany({
    orderBy: { orderPosition: 'asc' },
  })

  return <ClientArticlesSwiper initialArticles={articles} />
}
