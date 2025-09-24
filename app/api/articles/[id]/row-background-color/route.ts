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
    const { rowBackgroundColor } = await request.json()

    // Validate hex color format if provided
    if (rowBackgroundColor && !/^#[0-9A-F]{6}$/i.test(rowBackgroundColor)) {
      return NextResponse.json(
        { error: 'Invalid color format. Must be hex color (e.g., #FF0000)' },
        { status: 400 }
      )
    }

    // Update the article's row background color
    const updatedArticle = await prisma.article.update({
      where: { id },
      data: { rowBackgroundColor: rowBackgroundColor || null },
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

    sseManager.notifyArticleChange('updated', id)

    return NextResponse.json({ success: true, article: updatedArticle })
  } catch (error) {
    console.error('Error updating row background color:', error)
    return NextResponse.json(
      { error: 'Failed to update row background color' },
      { status: 500 }
    )
  }
}