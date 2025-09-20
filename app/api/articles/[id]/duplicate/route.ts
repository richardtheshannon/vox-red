import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'
import { auth } from '@/app/lib/auth'
import { sseManager } from '@/app/lib/realtime'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Fetch the original article with all its data
    const originalArticle = await prisma.article.findUnique({
      where: { id },
      include: {
        subArticles: {
          orderBy: { orderPosition: 'asc' }
        }
      }
    })

    if (!originalArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Calculate new order position (place after original)
    const nextPosition = await prisma.article.aggregate({
      where: {
        parentId: originalArticle.parentId,
        orderPosition: { gt: originalArticle.orderPosition }
      },
      _min: { orderPosition: true }
    })

    // If there's an article after this one, insert between them
    // Otherwise, just add 1 to the current position
    const newOrderPosition = nextPosition._min.orderPosition
      ? (originalArticle.orderPosition + nextPosition._min.orderPosition) / 2
      : originalArticle.orderPosition + 1

    // Create the duplicate article
    const duplicatedArticle = await prisma.article.create({
      data: {
        title: `${originalArticle.title} (Copy)`,
        subtitle: originalArticle.subtitle,
        content: originalArticle.content,
        audioUrl: originalArticle.audioUrl,
        mediaId: originalArticle.mediaId,
        orderPosition: newOrderPosition,
        textAlign: originalArticle.textAlign,
        verticalAlign: originalArticle.verticalAlign,
        parentId: originalArticle.parentId,
        published: false, // Always start as unpublished
        isProject: originalArticle.isProject,
        isFavorite: false, // Reset favorite status
        articleType: originalArticle.articleType,
        publishTimeStart: originalArticle.publishTimeStart,
        publishTimeEnd: originalArticle.publishTimeEnd,
        publishDays: originalArticle.publishDays
      }
    })

    // Optionally duplicate sub-articles if this is a parent article
    if (originalArticle.subArticles && originalArticle.subArticles.length > 0) {
      // Check if user wants to duplicate sub-articles (could be a query param)
      const duplicateSubArticles = request.nextUrl.searchParams.get('includeSubArticles') === 'true'

      if (duplicateSubArticles) {
        for (const subArticle of originalArticle.subArticles) {
          await prisma.article.create({
            data: {
              title: subArticle.title,
              subtitle: subArticle.subtitle,
              content: subArticle.content,
              audioUrl: subArticle.audioUrl,
              mediaId: subArticle.mediaId,
              orderPosition: subArticle.orderPosition,
              textAlign: subArticle.textAlign,
              verticalAlign: subArticle.verticalAlign,
              parentId: duplicatedArticle.id, // Link to the new parent
              published: false, // Always start as unpublished
              isProject: subArticle.isProject,
              isFavorite: false,
              articleType: subArticle.articleType,
              publishTimeStart: subArticle.publishTimeStart,
              publishTimeEnd: subArticle.publishTimeEnd,
              publishDays: subArticle.publishDays
            }
          })
        }
      }
    }

    // Notify about the change
    sseManager.notifyArticleChange('created', duplicatedArticle.id)

    return NextResponse.json({
      success: true,
      article: duplicatedArticle,
      message: `Article "${originalArticle.title}" duplicated successfully`
    })
  } catch (error) {
    console.error('Error duplicating article:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate article' },
      { status: 500 }
    )
  }
}