import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'
import { sseManager } from '@/app/lib/realtime'

export async function POST(request: NextRequest) {
  try {
    const { articleId } = await request.json()

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    // Get the current article
    const currentArticle = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        parent: {
          include: {
            subArticles: {
              orderBy: { orderPosition: 'asc' }
            }
          }
        },
        subArticles: {
          orderBy: { orderPosition: 'asc' }
        }
      }
    })

    if (!currentArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Only allow completing project slides
    if (!currentArticle.isProject) {
      return NextResponse.json(
        { error: 'Only project slides can be marked as complete' },
        { status: 400 }
      )
    }

    // Mark current article as unpublished (completed)
    await prisma.article.update({
      where: { id: articleId },
      data: { published: false }
    })

    let nextArticle = null
    let allCompleted = false

    // Determine if this is a parent or sub-article
    if (!currentArticle.parentId) {
      // This is a parent article
      // The first sub-article should already be published from import
      // Find the next unpublished sub-article
      const nextUnpublishedSub = currentArticle.subArticles.find(sub => !sub.published)

      if (nextUnpublishedSub) {
        // Publish the next unpublished sub-article
        nextArticle = await prisma.article.update({
          where: { id: nextUnpublishedSub.id },
          data: { published: true }
        })
      } else {
        // Check if there are any published sub-articles left
        const publishedSubs = currentArticle.subArticles.filter(sub => sub.published)
        if (publishedSubs.length === 0) {
          // All slides in this project are completed
          allCompleted = true
        } else {
          // There are still published sub-articles to view
          nextArticle = publishedSubs[0]
        }
      }
    } else {
      // This is a sub-article
      // Find the next unpublished sibling
      const siblings = currentArticle.parent?.subArticles || []
      const currentIndex = siblings.findIndex(s => s.id === articleId)

      // Look for the next unpublished sibling
      const remainingSiblings = siblings.slice(currentIndex + 1)
      const nextUnpublishedSibling = remainingSiblings.find(s => !s.published)

      if (nextUnpublishedSibling) {
        // Publish the next unpublished sibling
        nextArticle = await prisma.article.update({
          where: { id: nextUnpublishedSibling.id },
          data: { published: true }
        })
      } else {
        // Check if there are any published siblings after current
        const nextPublishedSibling = remainingSiblings.find(s => s.published)

        if (nextPublishedSibling) {
          nextArticle = nextPublishedSibling
        } else {
          // All slides in this project are completed
          allCompleted = true
        }
      }
    }

    // Notify all clients about the change
    sseManager.notifyArticleChange('updated', articleId)

    return NextResponse.json({
      success: true,
      nextArticleId: nextArticle?.id || null,
      allCompleted,
      projectTitle: currentArticle.parent?.title || currentArticle.title
    })

  } catch (error) {
    console.error('Error completing article:', error)
    return NextResponse.json(
      { error: 'Failed to complete article' },
      { status: 500 }
    )
  }
}