import { prisma } from '@/app/lib/database'
import ClientArticlesSwiper from './components/ClientArticlesSwiper'
import PasswordProtection from './components/PasswordProtection'

export const dynamic = 'force-dynamic'

export default async function Home() {
  // Get all main articles (published and unpublished)
  const allMainArticles = await prisma.article.findMany({
    where: {
      parentId: null, // Only get main articles (not sub-articles)
    },
    orderBy: { orderPosition: 'asc' },
    include: {
      subArticles: {
        where: { published: true }, // Only include published sub-articles
        orderBy: { orderPosition: 'asc' }
      }
    }
  })

  // Basic server-side filtering for published state only (no time/day filtering here)
  const publishedArticles = allMainArticles.filter(article => {
    // For projects: show if main article is published OR has published sub-articles
    if (article.isProject) {
      return article.published || article.subArticles.length > 0
    }
    // For standard articles: must be published (time/day filtering happens on client)
    return article.published
  })

  return (
    <PasswordProtection>
      <ClientArticlesSwiper initialArticles={publishedArticles} />
    </PasswordProtection>
  )
}
