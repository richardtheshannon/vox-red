import { prisma } from '@/app/lib/database'
import ClientArticlesSwiper from './components/ClientArticlesSwiper'
import PasswordProtection from './components/PasswordProtection'
import BackgroundMusicPlayer from './components/BackgroundMusicPlayer'

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
        orderBy: { orderPosition: 'asc' },
        select: {
          id: true,
          title: true,
          subtitle: true,
          content: true,
          audioUrl: true,
          orderPosition: true,
          textAlign: true,
          verticalAlign: true,
          parentId: true,
          published: true,
          isProject: true,
          isFavorite: true,
          pauseDuration: true,
          publishTimeStart: true,
          publishTimeEnd: true,
          publishDays: true,
          articleType: true,
        }
      }
    }
  })

  // Basic server-side filtering for published state only (no time/day filtering here)
  const publishedArticles = allMainArticles.filter(article => {
    // For projects: show if main article is published OR has published sub-articles
    if (article.isProject) {
      return article.published || article.subArticles.length > 0
    }
    // For standard articles: show if main article is published OR has published sub-articles
    return article.published || article.subArticles.length > 0
  })

  return (
    <PasswordProtection>
      <BackgroundMusicPlayer />
      <ClientArticlesSwiper initialArticles={publishedArticles} />
    </PasswordProtection>
  )
}
