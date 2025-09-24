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
    const { rowPublishTimeStart, rowPublishTimeEnd, rowPublishDays } = await request.json()

    // Validate time format if provided
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (rowPublishTimeStart && !timeRegex.test(rowPublishTimeStart)) {
      return NextResponse.json(
        { error: 'Invalid start time format. Use HH:MM format.' },
        { status: 400 }
      )
    }
    if (rowPublishTimeEnd && !timeRegex.test(rowPublishTimeEnd)) {
      return NextResponse.json(
        { error: 'Invalid end time format. Use HH:MM format.' },
        { status: 400 }
      )
    }

    // Update the article's row publishing settings
    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        rowPublishTimeStart: rowPublishTimeStart || null,
        rowPublishTimeEnd: rowPublishTimeEnd || null,
        rowPublishDays: rowPublishDays || null
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

    sseManager.notifyArticleChange('updated', id)

    return NextResponse.json({ success: true, article: updatedArticle })
  } catch (error) {
    console.error('Error updating row publishing settings:', error)
    return NextResponse.json(
      { error: 'Failed to update row publishing settings' },
      { status: 500 }
    )
  }
}