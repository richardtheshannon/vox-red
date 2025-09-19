import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { prisma } from '@/app/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const folderId = searchParams.get('folderId')

    const media = await prisma.media.findMany({
      where: folderId ? { folderId } : {},
      include: {
        folder: true,
        articles: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(media)
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}