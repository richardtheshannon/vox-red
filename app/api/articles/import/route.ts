import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'
import { auth } from '@/app/lib/auth'
import { parseMarkdownProject, validateProjectStructure } from '@/app/lib/markdownParser'
import { sseManager } from '@/app/lib/realtime'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the markdown content from the request
    const { markdown } = await request.json()

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: markdown content is required' },
        { status: 400 }
      )
    }

    // Parse the markdown
    const parsed = await parseMarkdownProject(markdown)

    if (parsed.error) {
      return NextResponse.json(
        { error: parsed.error },
        { status: 400 }
      )
    }

    // Validate the structure
    const validation = validateProjectStructure(parsed.sections)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Check for duplicate titles with existing articles
    const existingTitles = await prisma.article.findMany({
      select: { title: true },
      where: {
        title: {
          in: parsed.sections.map(s => s.title)
        }
      }
    })

    if (existingTitles.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot import: The following titles already exist: ${existingTitles.map(a => `"${a.title}"`).join(', ')}`
        },
        { status: 400 }
      )
    }

    // Get the maximum order position for main articles
    const maxMainPosition = await prisma.article.aggregate({
      where: { parentId: null },
      _max: { orderPosition: true }
    })

    const nextMainPosition = (maxMainPosition._max.orderPosition ?? -1) + 1

    // Create all articles in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the parent article (first section)
      const parentSection = parsed.sections[0]
      const parentArticle = await tx.article.create({
        data: {
          title: parentSection.title,
          content: parentSection.content,
          orderPosition: nextMainPosition,
          textAlign: 'left',
          verticalAlign: 'center',
          published: true, // First slide is published
          isProject: true // Mark as project
        }
      })

      // Create sub-articles for remaining sections
      const subArticles = []
      for (let i = 1; i < parsed.sections.length; i++) {
        const section = parsed.sections[i]
        const subArticle = await tx.article.create({
          data: {
            title: section.title,
            content: section.content,
            orderPosition: i - 1, // Start from 0 for sub-articles
            parentId: parentArticle.id,
            textAlign: 'left',
            verticalAlign: 'center',
            published: false, // All sub-articles start unpublished, will be revealed as user completes
            isProject: true // Mark as project
          }
        })
        subArticles.push(subArticle)
      }

      return {
        parent: parentArticle,
        subArticles
      }
    })

    // Notify all clients about the new articles
    sseManager.notifyArticleChange('created', result.parent.id)

    return NextResponse.json({
      message: `Successfully imported project "${result.parent.title}" with ${result.subArticles.length} sub-slides`,
      parentId: result.parent.id,
      totalSlides: parsed.sections.length
    }, { status: 201 })

  } catch (error) {
    console.error('Error importing markdown project:', error)
    return NextResponse.json(
      { error: 'Failed to import project. Please try again.' },
      { status: 500 }
    )
  }
}