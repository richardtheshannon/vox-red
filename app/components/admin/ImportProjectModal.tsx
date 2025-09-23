'use client'

import { useState, useRef } from 'react'
import { parseMarkdownProject, type ParsedSection } from '@/app/lib/markdownParser'

interface ImportProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ImportProjectModal({ isOpen, onClose, onSuccess }: ImportProjectModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ParsedSection[]>([])
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [mp3BaseUrl, setMp3BaseUrl] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.md')) {
      setError('Please select a markdown (.md) file')
      return
    }

    setFile(selectedFile)
    setError('')

    // Read and parse the file
    try {
      const content = await selectedFile.text()
      const parsed = await parseMarkdownProject(content)

      if (parsed.error) {
        setError(parsed.error)
        setPreview([])
      } else {
        setPreview(parsed.sections)
      }
    } catch {
      setError('Failed to read file')
      setPreview([])
    }
  }

  const handleImport = async () => {
    if (!file || preview.length === 0) return

    setLoading(true)
    setError('')

    try {
      const content = await file.text()

      const response = await fetch('/api/articles/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: content,
          mp3BaseUrl: mp3BaseUrl.trim() || undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import project')
      }

      // Success
      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import project')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview([])
    setError('')
    setMp3BaseUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Import Markdown Project</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            Upload a markdown file to create a project with horizontal sub-slides
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Markdown File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 dark:file:bg-gray-700 file:text-blue-700 dark:file:text-blue-400
                hover:file:bg-blue-100 dark:hover:file:bg-gray-600"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Selected: {file.name}
              </p>
            )}
          </div>

          {/* MP3 Base URL Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              MP3 Base URL (optional)
            </label>
            <input
              type="text"
              value={mp3BaseUrl}
              onChange={(e) => setMp3BaseUrl(e.target.value)}
              placeholder="https://vox.red/mp3/my-project"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              If provided, articles will be automatically linked to sequential MP3 files: 0001.mp3, 0002.mp3, etc.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Preview Structure
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      Main Slide:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-gray-100">{preview[0].title}</span>
                  </div>
                </div>
                {preview.slice(1).map((section, index) => (
                  <div key={index} className="ml-8 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-gray-600 dark:text-gray-400">
                        Sub-slide {index + 1}:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">{section.title}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Total: 1 main slide + {preview.length - 1} sub-slide{preview.length - 1 !== 1 ? 's' : ''}
              </p>
              {mp3BaseUrl.trim() && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">MP3 URLs will be generated:</h4>
                  <div className="space-y-1 text-xs text-green-700 dark:text-green-300">
                    {preview.map((section, index) => (
                      <div key={index}>
                        <span className="font-medium">{section.title}:</span> {mp3BaseUrl.replace(/\/$/, '')}/{String(index + 1).padStart(4, '0')}.mp3
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || preview.length === 0 || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing...' : 'Import Project'}
          </button>
        </div>
      </div>
    </div>
  )
}