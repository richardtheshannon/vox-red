import { NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { prisma } from '@/app/lib/database'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Get the main article and all its sub-articles
    const mainArticle = await prisma.article.findUnique({
      where: { id },
      include: {
        subArticles: {
          orderBy: { orderPosition: 'asc' }
        }
      }
    })

    if (!mainArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Only randomize if there are sub-articles
    if (!mainArticle.subArticles || mainArticle.subArticles.length === 0) {
      return NextResponse.json({ 
        message: 'No sub-articles to randomize' 
      }, { status: 200 })
    }

    // Shuffle the sub-articles array
    const shuffledSubArticles = [...mainArticle.subArticles]
    for (let i = shuffledSubArticles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledSubArticles[i], shuffledSubArticles[j]] = [shuffledSubArticles[j], shuffledSubArticles[i]]
    }

    // Update the orderPosition for each sub-article
    const updatePromises = shuffledSubArticles.map((subArticle, index) => 
      prisma.article.update({
        where: { id: subArticle.id },
        data: { orderPosition: index }
      })
    )

    await Promise.all(updatePromises)

    // Trigger real-time update
    const response = NextResponse.json({ 
      message: 'Row articles randomized successfully',
      articlesRandomized: shuffledSubArticles.length
    })

    // Add SSE trigger header
    response.headers.set('X-Trigger-Event', 'article-updated')

    return response
  } catch (error) {
    console.error('Failed to randomize row articles:', error)
    return NextResponse.json(
      { error: 'Failed to randomize row articles' },
      { status: 500 }
    )
  }
}