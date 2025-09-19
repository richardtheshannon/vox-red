import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import mime from 'mime-types'

const UPLOAD_DIR = process.env.NODE_ENV === 'production' ? '/app/uploads' : './uploads'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    if (!params.path || params.path.length === 0) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      )
    }

    // Reconstruct the file path from segments
    const filePath = path.join(UPLOAD_DIR, 'audio', ...params.path)

    // Security: Ensure the resolved path is within the uploads directory
    const resolvedPath = path.resolve(filePath)
    const uploadsDir = path.resolve(UPLOAD_DIR)
    if (!resolvedPath.startsWith(uploadsDir)) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      )
    }

    // Check if file exists
    try {
      await fs.access(resolvedPath)
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Get file stats
    const stats = await fs.stat(resolvedPath)
    if (!stats.isFile()) {
      return NextResponse.json(
        { error: 'Not a file' },
        { status: 400 }
      )
    }

    // Read file
    const fileBuffer = await fs.readFile(resolvedPath)

    // Determine MIME type
    const fileName = params.path[params.path.length - 1]
    const mimeType = mime.lookup(fileName) || 'application/octet-stream'

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=31536000',
        'Accept-Ranges': 'bytes'
      }
    })
  } catch (error) {
    console.error('Serve error:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}