import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { prisma } from '@/app/lib/database'
import { sseManager } from '@/app/lib/realtime'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { subtitle } = await request.json()

    // Update the main article's subtitle
    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        subtitle: subtitle || null
      },
      include: {
        media: true,
        subArticles: {
          include: {
            media: true,
          },
          orderBy: { orderPosition: 'asc' }
        }
      }
    })

    // Propagate subtitle to all sub-articles in this row
    if (updatedArticle.subArticles && updatedArticle.subArticles.length > 0) {
      const subArticleIds = updatedArticle.subArticles.map(sub => sub.id)

      await prisma.article.updateMany({
        where: {
          id: { in: subArticleIds },
          parentId: id
        },
        data: {
          subtitle: subtitle || null
        }
      })

      // Notify changes for each sub-article
      subArticleIds.forEach(subId => {
        sseManager.notifyArticleChange('updated', subId)
      })
    }

    sseManager.notifyArticleChange('updated', id)

    return NextResponse.json({ success: true, article: updatedArticle })
  } catch (error) {
    console.error('Error updating row subtitle:', error)
    return NextResponse.json(
      { error: 'Failed to update row subtitle' },
      { status: 500 }
    )
  }
}