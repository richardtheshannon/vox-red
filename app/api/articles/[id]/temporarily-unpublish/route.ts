import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'
import { sseManager } from '@/app/lib/realtime'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Toggle temporarily unpublished status
    const currentArticle = await prisma.article.findUnique({
      where: { id },
      select: { temporarilyUnpublished: true }
    })

    if (!currentArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const newStatus = !currentArticle.temporarilyUnpublished

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        temporarilyUnpublished: newStatus,
        unpublishedDate: newStatus ? new Date() : null
      },
    })

    sseManager.notifyArticleChange('updated', id)
    return NextResponse.json({
      success: true,
      temporarilyUnpublished: updatedArticle.temporarilyUnpublished
    })
  } catch (error) {
    console.error('Error toggling temporary unpublish status:', error)
    return NextResponse.json(
      { error: 'Failed to update temporary unpublish status' },
      { status: 500 }
    )
  }
}