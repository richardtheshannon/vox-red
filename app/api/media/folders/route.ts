import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { prisma } from '@/app/lib/database'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().optional()
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const folders = await prisma.mediaFolder.findMany({
      orderBy: { name: 'asc' },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { media: true }
        }
      }
    })

    return NextResponse.json(folders)
  } catch (error) {
    console.error('Failed to fetch folders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, parentId } = createFolderSchema.parse(body)

    // Generate path based on parent
    let path = name
    if (parentId) {
      const parent = await prisma.mediaFolder.findUnique({
        where: { id: parentId }
      })
      if (!parent) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 })
      }
      path = `${parent.path}/${name}`
    }

    // Check if folder with this path already exists
    const existingFolder = await prisma.mediaFolder.findFirst({
      where: { path }
    })

    if (existingFolder) {
      return NextResponse.json(
        { error: 'Folder with this name already exists in this location' },
        { status: 400 }
      )
    }

    const folder = await prisma.mediaFolder.create({
      data: {
        name,
        path,
        parentId: parentId || null
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { media: true }
        }
      }
    })

    return NextResponse.json(folder)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Failed to create folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}