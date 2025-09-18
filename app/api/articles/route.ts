import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'
import { auth } from '@/app/lib/auth'
import { articleSchema } from '@/app/lib/validations'
import { sseManager } from '@/app/lib/realtime'

export async function GET() {
  try {
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

    // Basic server-side filtering for published state only (no time/day filtering here)
    const publishedArticles = allMainArticles.filter(article => {
      // For projects: show if main article is published OR has published sub-articles
      if (article.isProject) {
        return article.published || article.subArticles.length > 0
      }
      // For standard articles: must be published (time/day filtering happens on client)
      return article.published
    })

    return NextResponse.json(publishedArticles)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = articleSchema.parse(body)

    // Calculate order position based on whether it's a main article or sub-article
    const maxPosition = await prisma.article.aggregate({
      where: { parentId: validatedData.parentId || null },
      _max: { orderPosition: true },
    })

    const newArticle = await prisma.article.create({
      data: {
        ...validatedData,
        parentId: validatedData.parentId || null,
        orderPosition: validatedData.orderPosition ??
          ((maxPosition._max.orderPosition ?? -1) + 1),
      },
    })

    sseManager.notifyArticleChange('created', newArticle.id)
    return NextResponse.json(newArticle, { status: 201 })
  } catch (error) {
    console.error('Error creating article:', error)

    // Check if it's a Zod validation error
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}