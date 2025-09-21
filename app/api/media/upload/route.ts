import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { prisma } from '@/app/lib/database'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import mime from 'mime-types'

// Use UPLOAD_PATH env var if set (for Railway persistent volumes), otherwise use defaults
const UPLOAD_DIR = process.env.UPLOAD_PATH || (process.env.NODE_ENV === 'production' ? '/app/uploads' : './uploads')
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

    // Ensure upload directory exists with better error handling
    const audioDir = path.join(UPLOAD_DIR, 'audio')
    try {
      await fs.mkdir(audioDir, { recursive: true })
    } catch (mkdirError: any) {
      console.error('Directory creation error:', mkdirError)
      // If directory exists, that's okay
      if (mkdirError.code !== 'EEXIST') {
        return NextResponse.json(
          {
            error: `Unable to create upload directory: ${mkdirError.message}`,
            details: {
              uploadDir: UPLOAD_DIR,
              audioDir: audioDir,
              code: mkdirError.code
            }
          },
          { status: 500 }
        )
      }
    }

    // Get form data from request
    const formData = await request.formData()
    const file = formData.get('file') as File
    const selectedFolderId = formData.get('folderId') as string | null

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

    let folder = null
    let filePath = ''

    if (selectedFolderId) {
      // Use selected folder
      folder = await prisma.mediaFolder.findUnique({
        where: { id: selectedFolderId }
      })

      if (!folder) {
        return NextResponse.json(
          { error: 'Selected folder not found' },
          { status: 404 }
        )
      }

      // Create physical directory structure based on folder path
      const folderPath = path.join(audioDir, folder.path)
      try {
        await fs.mkdir(folderPath, { recursive: true })
      } catch (mkdirError: any) {
        console.error('Folder directory creation error:', mkdirError)
        if (mkdirError.code !== 'EEXIST') {
          return NextResponse.json(
            {
              error: `Unable to create folder directory: ${mkdirError.message}`,
              details: {
                folderPath: folderPath,
                code: mkdirError.code
              }
            },
            { status: 500 }
          )
        }
      }
      filePath = path.join(folderPath, storedName)
    } else {
      // Create default date-based folder structure
      const now = new Date()
      const year = now.getFullYear()
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      const datePath = path.join(audioDir, year.toString(), month)
      try {
        await fs.mkdir(datePath, { recursive: true })
      } catch (mkdirError: any) {
        console.error('Date directory creation error:', mkdirError)
        if (mkdirError.code !== 'EEXIST') {
          return NextResponse.json(
            {
              error: `Unable to create date directory: ${mkdirError.message}`,
              details: {
                datePath: datePath,
                code: mkdirError.code
              }
            },
            { status: 500 }
          )
        }
      }
      filePath = path.join(datePath, storedName)

      // Get or create date-based folder
      const folderPath = `audio/${year}/${month}`
      folder = await prisma.mediaFolder.findFirst({
        where: { path: folderPath }
      })

      if (!folder) {
        folder = await prisma.mediaFolder.create({
          data: {
            name: `${year}-${month}`,
            path: folderPath
          }
        })
      }
    }

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await fs.writeFile(filePath, buffer)

    // Create media record in database
    const media = await prisma.media.create({
      data: {
        filename: file.name,
        storedName: storedName,
        path: filePath,
        url: `/api/media/serve/${folder.path.replace('audio/', '')}/${storedName}`,
        size: file.size,
        mimeType: fileType,
        folderId: folder.id
      },
      include: {
        folder: true
      }
    })

    return NextResponse.json({
      success: true,
      media: media
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'

    console.error('Upload error details:', {
      error: errorMessage,
      stack: errorStack,
      uploadDir: UPLOAD_DIR,
      nodeEnv: process.env.NODE_ENV
    })
    return NextResponse.json(
      { error: 'Failed to upload file', details: errorMessage },
      { status: 500 }
    )
  }
}