import { prisma } from '@/app/lib/database'
import ClientArticlesSwiper from './components/ClientArticlesSwiper'
import PasswordProtection from './components/PasswordProtection'
import { shouldShowArticle } from './lib/publishingUtils'

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

  // Filter articles based on visibility rules and apply dynamic publishing to sub-articles
  const visibleArticles = allMainArticles.filter(article => {
    // Filter sub-articles with dynamic publishing rules for standard articles
    const filteredSubArticles = article.subArticles.filter(subArticle => {
      if (subArticle.isProject) {
        return subArticle.published
      }
      return shouldShowArticle(subArticle)
    })

    // Update the article with filtered sub-articles
    article.subArticles = filteredSubArticles

    // For projects: show if main article is published OR has published sub-articles
    if (article.isProject) {
      return article.published || article.subArticles.length > 0
    }
    // For standard articles: apply dynamic publishing rules
    return shouldShowArticle(article)
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
