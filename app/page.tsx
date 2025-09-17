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

  // Filter articles based on visibility rules
  const visibleArticles = allMainArticles.filter(article => {
    // For projects: show if main article is published OR has published sub-articles
    if (article.isProject) {
      return article.published || article.subArticles.length > 0
    }
    // For non-projects: only show if main article is published
    return article.published
  })

  // Filter out completed projects (projects with no visible content)
  const activeArticles = visibleArticles.filter(article => {
    if (article.isProject) {
      // Project is active if main article is published OR has published sub-articles
      return article.published || article.subArticles.length > 0
    }
    return true
  })

  return (
    <PasswordProtection>
      <ClientArticlesSwiper initialArticles={activeArticles} />
    </PasswordProtection>
  )
}
