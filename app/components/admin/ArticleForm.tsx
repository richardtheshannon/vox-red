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
  }
}

export default function ArticleForm({ article }: ArticleFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(article?.title || '')
  const [subtitle, setSubtitle] = useState(article?.subtitle || '')
  const [content, setContent] = useState(article?.content || '')
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