'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatBytes } from '@/app/lib/utils'

interface MediaFile {
  id: string
  filename: string
  storedName: string
  path: string
  url: string
  size: number
  mimeType: string
  folderId: string | null
  createdAt: string
  updatedAt: string
  folder: {
    id: string
    name: string
    path: string
  } | null
  articles: {
    id: string
    title: string
  }[]
}

interface MediaFolder {
  id: string
  name: string
  path: string
  parentId: string | null
  createdAt: string
  parent: {
    id: string
    name: string
  } | null
  children: MediaFolder[]
  _count: {
    media: number
  }
}

export default function AdminMediaManager() {
  const [media, setMedia] = useState<MediaFile[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderParent, setNewFolderParent] = useState('')

  const fetchMedia = useCallback(async () => {
    try {
      const response = await fetch('/api/media')
      if (response.ok) {
        const data = await response.json()
        setMedia(data)
      }
    } catch (error) {
      console.error('Failed to fetch media:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchFolders = useCallback(async () => {
    try {
      const response = await fetch('/api/media/folders')
      if (response.ok) {
        const data = await response.json()
        setFolders(data)
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error)
    }
  }, [])

  useEffect(() => {
    fetchMedia()
    fetchFolders()
  }, [fetchMedia, fetchFolders])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      if (selectedFolderId && selectedFolderId !== 'no-folder') {
        formData.append('folderId', selectedFolderId)
      }

      try {
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          await fetchMedia()
        } else {
          const error = await response.json()
          alert(`Failed to upload ${file.name}: ${error.error}`)
        }
      } catch (error) {
        console.error('Upload error:', error)
        alert(`Failed to upload ${file.name}`)
      }
    }

    setUploading(false)
    if (e.target) e.target.value = ''
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const response = await fetch(`/api/media/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchMedia()
      } else {
        const error = await response.json()
        alert(`Failed to delete: ${error.error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete file')
    }
  }

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedFiles)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedFiles(newSelection)
  }

  const handlePreview = (url: string) => {
    setPreviewUrl(url)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await fetch('/api/media/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: newFolderParent || undefined
        })
      })

      if (response.ok) {
        await fetchFolders()
        setNewFolderName('')
        setNewFolderParent('')
        setShowCreateFolder(false)
      } else {
        const error = await response.json()
        alert(`Failed to create folder: ${error.error}`)
      }
    } catch (error) {
      console.error('Create folder error:', error)
      alert('Failed to create folder')
    }
  }

  const renderFolderOptions = () => {
    const sortedFolders = [...folders].sort((a, b) => a.path.localeCompare(b.path))
    return sortedFolders.map(folder => (
      <option key={folder.id} value={folder.id}>
        {folder.path}
      </option>
    ))
  }

  const filteredMedia = selectedFolderId === ''
    ? media
    : selectedFolderId === 'no-folder'
    ? media.filter(file => !file.folderId)
    : media.filter(file => file.folderId === selectedFolderId)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Media Manager
          </h1>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/articles"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Articles
            </Link>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              New Folder
            </button>
            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              {uploading ? 'Uploading...' : 'Upload Files'}
              <input
                type="file"
                accept="audio/mpeg,audio/mp3"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Folder Selection and Management */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Folder:
            </label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Files (uploads to date-based)</option>
              <option value="no-folder">No Folder (date-based files only)</option>
              {renderFolderOptions()}
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredMedia.length} of {media.length} file{media.length !== 1 ? 's' : ''} shown
            </div>
          </div>
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Create New Folder
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Folder Name:
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Parent Folder (optional):
                </label>
                <select
                  value={newFolderParent}
                  onChange={(e) => setNewFolderParent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">None (Root level)</option>
                  {renderFolderOptions()}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateFolder(false)
                  setNewFolderName('')
                  setNewFolderParent('')
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Preview Player */}
      {previewUrl && (
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Audio Preview
            </span>
            <button
              onClick={() => setPreviewUrl(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Close
            </button>
          </div>
          <audio controls className="w-full">
            <source src={previewUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* Media Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No media files uploaded yet</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No files found in selected folder</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMedia.map((file) => (
            <div
              key={file.id}
              className={`border rounded-lg p-4 ${
                selectedFiles.has(file.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {/* File Icon */}
              <div className="flex justify-center mb-4">
                <svg
                  className="w-16 h-16 text-gray-400 dark:text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>

              {/* File Info */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate" title={file.filename}>
                  {file.filename}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatBytes(file.size)}
                </p>
                {file.folder && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Folder: {file.folder.name}
                  </p>
                )}
                {file.articles.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Used in {file.articles.length} article{file.articles.length > 1 ? 's' : ''}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(file.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handlePreview(file.url)}
                  className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Preview
                </button>
                <button
                  onClick={() => toggleSelection(file.id)}
                  className="flex-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  {selectedFiles.has(file.id) ? 'Deselect' : 'Select'}
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  disabled={file.articles.length > 0}
                  className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                    file.articles.length > 0
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                  }`}
                  title={file.articles.length > 0 ? 'Cannot delete: File is in use' : 'Delete file'}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}