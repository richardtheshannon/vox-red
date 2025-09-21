import { NextRequest, NextResponse } from 'next/server'
import { promises as fs, createReadStream } from 'fs'
import path from 'path'
import mime from 'mime-types'

// Use UPLOAD_PATH env var if set (for Railway persistent volumes), otherwise use defaults
// In production, fallback to /tmp if /app/uploads is not writable
const UPLOAD_DIR = process.env.UPLOAD_PATH || (process.env.NODE_ENV === 'production' ? '/tmp/uploads' : './uploads')

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params
    if (!pathArray || pathArray.length === 0) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      )
    }

    // Reconstruct the file path from segments
    const filePath = path.join(UPLOAD_DIR, 'audio', ...pathArray)

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

    // Determine MIME type
    const fileName = pathArray[pathArray.length - 1]
    const mimeType = mime.lookup(fileName) || 'application/octet-stream'

    // Parse Range header
    const range = request.headers.get('range')
    const fileSize = stats.size

    if (range) {
      // Handle Range request for partial content (mobile streaming)
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse('Range Not Satisfiable', {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`
          }
        })
      }

      const chunkSize = (end - start) + 1
      const stream = createReadStream(resolvedPath, { start, end })

      return new NextResponse(stream as unknown as BodyInit, {
        status: 206,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': chunkSize.toString(),
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000'
        }
      })
    } else {
      // Handle full file request (desktop/fallback)
      const stream = createReadStream(resolvedPath)

      return new NextResponse(stream as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': fileSize.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000'
        }
      })
    }
  } catch (error) {
    console.error('Serve error:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}