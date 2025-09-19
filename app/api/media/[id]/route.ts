import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { prisma } from '@/app/lib/database'
import { promises as fs } from 'fs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Find the media record
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        articles: true
      }
    })

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      )
    }

    // Check if media is in use
    if (media.articles.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete media that is in use by articles' },
        { status: 400 }
      )
    }

    // Delete the physical file
    try {
      await fs.unlink(media.path)
    } catch (error) {
      console.error('Failed to delete file:', error)
      // Continue even if file deletion fails (might already be deleted)
    }

    // Delete the database record
    await prisma.media.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    )
  }
}