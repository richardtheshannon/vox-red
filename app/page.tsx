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
      temporarilyUnpublished: true,
      pauseDuration: true,
      publishTimeStart: true,
      publishTimeEnd: true,
      publishDays: true,
      rowPublishTimeStart: true,
      rowPublishTimeEnd: true,
      rowPublishDays: true,
      articleType: true,
      createdAt: true,
      updatedAt: true,
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
          temporarilyUnpublished: true,
          pauseDuration: true,
          publishTimeStart: true,
          publishTimeEnd: true,
          publishDays: true,
          articleType: true,
        }
      }
    }
  })

  // Basic server-side filtering for published state and temporary unpublishing (no time/day filtering here)
  const publishedArticles = allMainArticles.filter(article => {
    // Show the row if main article is published and not temporarily unpublished
    const mainArticleVisible = article.published && !article.temporarilyUnpublished

    // Show the row if it has published sub-articles (even if main article is temporarily unpublished)
    const hasPublishedSubArticles = article.subArticles && article.subArticles.length > 0

    // For projects: show if main article is visible OR has published sub-articles
    if (article.isProject) {
      return mainArticleVisible || hasPublishedSubArticles
    }
    // For standard articles: show if main article is visible OR has published sub-articles
    return mainArticleVisible || hasPublishedSubArticles
  })

  return (
    <PasswordProtection>
      <BackgroundMusicPlayer />
      <ClientArticlesSwiper initialArticles={publishedArticles} />
    </PasswordProtection>
  )
}
