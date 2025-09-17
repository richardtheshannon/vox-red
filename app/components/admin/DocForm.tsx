'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Input from '../ui/Input'
import Button from '../ui/Button'

const TiptapEditor = dynamic(() => import('./TiptapEditor'), { ssr: false })

interface DocFormProps {
  doc?: {
    id: string
    title: string
    subtitle?: string | null
    content: string
    textAlign?: string
    verticalAlign?: string
    parentId?: string | null
  }
  allDocs?: Array<{
    id: string
    title: string
    parentId?: string | null
  }>
}

export default function DocForm({ doc, allDocs }: DocFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(doc?.title || '')
  const [subtitle, setSubtitle] = useState(doc?.subtitle || '')
  const [content, setContent] = useState(doc?.content || '')
  const [textAlign, setTextAlign] = useState(doc?.textAlign || 'left')
  const [verticalAlign, setVerticalAlign] = useState(doc?.verticalAlign || 'center')
  const [parentId, setParentId] = useState<string | null>(doc?.parentId || null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [availableDocs, setAvailableDocs] = useState<typeof allDocs>([])

  useEffect(() => {
    // Fetch main docs to use as parent options
    const fetchDocs = async () => {
      try {
        const response = await fetch('/api/docs')
        if (response.ok) {
          const docs = await response.json()
          // Only show main docs as parent options
          setAvailableDocs(docs.filter((d: { parentId?: string | null, id: string }) => !d.parentId && d.id !== doc?.id))
        }
      } catch (error) {
        console.error('Error fetching docs:', error)
      }
    }
    if (!allDocs) {
      fetchDocs()
    } else {
      setAvailableDocs(allDocs.filter(d => !d.parentId && d.id !== doc?.id))
    }
  }, [doc?.id, allDocs])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const url = doc
        ? `/api/docs/${doc.id}`
        : '/api/docs'

      const method = doc ? 'PUT' : 'POST'

      const requestData = {
        title,
        subtitle: subtitle || null,
        content,
        textAlign,
        verticalAlign,
        parentId: parentId || null,
      }

      console.log('Submitting doc data:', requestData)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error('Failed to save documentation')
      }

      router.push('/admin/docs')
      router.refresh()
    } catch {
      setError('Failed to save documentation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="Enter documentation title"
      />

      <Input
        label="Subtitle (optional)"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="Enter documentation subtitle"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Parent Documentation (optional - for sub-docs)
        </label>
        <select
          value={parentId || ''}
          onChange={(e) => setParentId(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">None (Main Documentation)</option>
          {availableDocs?.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Text Alignment
          </label>
          <select
            value={textAlign}
            onChange={(e) => setTextAlign(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vertical Alignment
          </label>
          <select
            value={verticalAlign}
            onChange={(e) => setVerticalAlign(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Content
        </label>
        <TiptapEditor content={content} onChange={setContent} />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : doc ? 'Update Documentation' : 'Create Documentation'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/admin/docs')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}