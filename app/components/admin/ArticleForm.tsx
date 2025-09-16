'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Input from '../ui/Input'
import Button from '../ui/Button'

const TiptapEditor = dynamic(() => import('./TiptapEditor'), { ssr: false })

interface ArticleFormProps {
  article?: {
    id: string
    title: string
    subtitle?: string | null
    content: string
    textAlign?: string
    verticalAlign?: string
  }
}

export default function ArticleForm({ article }: ArticleFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(article?.title || '')
  const [subtitle, setSubtitle] = useState(article?.subtitle || '')
  const [content, setContent] = useState(article?.content || '')
  const [textAlign, setTextAlign] = useState(article?.textAlign || 'left')
  const [verticalAlign, setVerticalAlign] = useState(article?.verticalAlign || 'center')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const url = article 
        ? `/api/articles/${article.id}`
        : '/api/articles'
      
      const method = article ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          subtitle: subtitle || undefined,
          content,
          textAlign,
          verticalAlign,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save article')
      }

      router.push('/admin/articles')
      router.refresh()
    } catch {
      setError('Failed to save article. Please try again.')
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
        placeholder="Enter article title"
      />

      <Input
        label="Subtitle (optional)"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="Enter article subtitle"
      />

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
          {isSubmitting ? 'Saving...' : article ? 'Update Article' : 'Create Article'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/admin/articles')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}