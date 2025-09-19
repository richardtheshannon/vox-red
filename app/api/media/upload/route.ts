import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { prisma } from '@/app/lib/database'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import mime from 'mime-types'

const UPLOAD_DIR = process.env.NODE_ENV === 'production' ? '/app/uploads' : './uploads'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/x-mpeg', 'audio/x-mp3']

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Ensure upload directory exists
    const audioDir = path.join(UPLOAD_DIR, 'audio')
    await fs.mkdir(audioDir, { recursive: true })

    // Get form data from request
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const fileType = file.type || mime.lookup(file.name) || ''
    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP3 files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = path.extname(file.name) || '.mp3'
    const storedName = `${uuidv4()}${ext}`

    // Create date-based folder structure
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const datePath = path.join(audioDir, year.toString(), month)
    await fs.mkdir(datePath, { recursive: true })

    const filePath = path.join(datePath, storedName)

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await fs.writeFile(filePath, buffer)

    // Get folder if exists
    const folderPath = `audio/${year}/${month}`
    let folder = await prisma.mediaFolder.findFirst({
      where: { path: folderPath }
    })

    // Create folder if doesn't exist
    if (!folder) {
      folder = await prisma.mediaFolder.create({
        data: {
          name: `${year}-${month}`,
          path: folderPath
        }
      })
    }

    // Create media record in database
    const media = await prisma.media.create({
      data: {
        filename: file.name,
        storedName: storedName,
        path: filePath,
        url: `/api/media/serve/${year}/${month}/${storedName}`,
        size: file.size,
        mimeType: fileType,
        folderId: folder.id
      }
    })

    return NextResponse.json({
      success: true,
      media: media
    })
  } catch (error) {
    console.error('Upload error details:', {
      error: error.message,
      stack: error.stack,
      uploadDir: UPLOAD_DIR,
      nodeEnv: process.env.NODE_ENV
    })
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    )
  }
}