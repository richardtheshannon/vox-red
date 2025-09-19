'use client'

import { useState, useEffect } from 'react'
import { formatBytes } from '@/app/lib/utils'

interface MediaFile {
  id: string
  filename: string
  url: string
  size: number
  createdAt: string
}

interface MediaSelectorProps {
  value: string | null  // Can be either URL or mediaId
  mediaId?: string | null
  onChange: (url: string | null, mediaId: string | null) => void
  label?: string
  help?: string
}

export default function MediaSelector({ value, mediaId, onChange, label, help }: MediaSelectorProps) {
  const [showSelector, setShowSelector] = useState(false)
  const [media, setMedia] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (mediaId) {
      // Fetch the selected media details
      fetchMediaById(mediaId)
    }
  }, [mediaId])

  const fetchMediaById = async (id: string) => {
    try {
      const response = await fetch('/api/media')
      if (response.ok) {
        const allMedia = await response.json()
        const found = allMedia.find((m: MediaFile & { id: string }) => m.id === id)
        if (found) {
          setSelectedMedia(found)
          setPreviewUrl(found.url)
        }
      }
    } catch (error) {
      console.error('Failed to fetch media:', error)
    }
  }

  const fetchMedia = async () => {
    setLoading(true)
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
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const { media } = await response.json()
        setSelectedMedia(media)
        onChange(media.url, media.id)
        setPreviewUrl(media.url)
        setShowSelector(false)
      } else {
        const error = await response.json()
        alert(`Failed to upload: ${error.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleSelect = (file: MediaFile) => {
    setSelectedMedia(file)
    onChange(file.url, file.id)
    setPreviewUrl(file.url)
    setShowSelector(false)
  }

  const handleRemove = () => {
    setSelectedMedia(null)
    onChange(null, null)
    setPreviewUrl(null)
  }

  const handleOpenSelector = () => {
    setShowSelector(true)
    fetchMedia()
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label || 'Audio File'}
      </label>

      {/* Current Selection or External URL */}
      {selectedMedia || value ? (
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedMedia ? selectedMedia.filename : 'External URL'}
                </p>
                {selectedMedia && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatBytes(selectedMedia.size)}
                  </p>
                )}
                {!selectedMedia && value && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
                    {value}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preview Audio */}
          {(previewUrl || value) && (
            <div className="mb-3">
              <audio controls className="w-full h-8">
                <source src={previewUrl || value || ''} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleOpenSelector}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Browse Files
            </button>
            <label className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer">
              Upload New
              <input
                type="file"
                accept="audio/mpeg,audio/mp3"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
          <svg className="mx-auto w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No audio file selected</p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={handleOpenSelector}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Browse Files
            </button>
            <label className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer">
              {uploading ? 'Uploading...' : 'Upload New'}
              <input
                type="file"
                accept="audio/mpeg,audio/mp3"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {help && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{help}</p>
      )}

      {/* File Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowSelector(false)}></div>

            <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Select Audio File
                </h3>
              </div>

              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
                  </div>
                ) : media.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No audio files available</p>
                    <label className="mt-4 inline-block px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer">
                      Upload First File
                      <input
                        type="file"
                        accept="audio/mpeg,audio/mp3"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {media.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => handleSelect(file)}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-8 h-8 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                          </svg>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {file.filename}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatBytes(file.size)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSelector(false)}
                  className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}