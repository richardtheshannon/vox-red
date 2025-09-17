'use client'

import { useState, useEffect } from 'react'
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
    audioUrl?: string | null
    textAlign?: string
    verticalAlign?: string
    parentId?: string | null
  }
  allArticles?: Array<{
    id: string
    title: string
    parentId?: string | null
  }>
}

export default function ArticleForm({ article, allArticles }: ArticleFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(article?.title || '')
  const [subtitle, setSubtitle] = useState(article?.subtitle || '')
  const [content, setContent] = useState(article?.content || '')
  const [audioUrl, setAudioUrl] = useState(article?.audioUrl || '')
  const [textAlign, setTextAlign] = useState(article?.textAlign || 'left')
  const [verticalAlign, setVerticalAlign] = useState(article?.verticalAlign || 'center')
  const [parentId, setParentId] = useState<string | null>(article?.parentId || null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [availableArticles, setAvailableArticles] = useState<typeof allArticles>([])

  useEffect(() => {
    // Fetch main articles to use as parent options
    const fetchArticles = async () => {
      try {
        const response = await fetch('/api/articles')
        if (response.ok) {
          const articles = await response.json()
          // Only show main articles as parent options
          setAvailableArticles(articles.filter((a: { parentId?: string | null, id: string }) => !a.parentId && a.id !== article?.id))
        }
      } catch (error) {
        console.error('Error fetching articles:', error)
      }
    }
    if (!allArticles) {
      fetchArticles()
    } else {
      setAvailableArticles(allArticles.filter(a => !a.parentId && a.id !== article?.id))
    }
  }, [article?.id, allArticles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const url = article 
        ? `/api/articles/${article.id}`
        : '/api/articles'
      
      const method = article ? 'PUT' : 'POST'

      const requestData = {
        title,
        subtitle: subtitle || null,
        content,
        audioUrl: audioUrl || null,
        textAlign,
        verticalAlign,
        parentId: parentId || null,
      }

      console.log('Submitting article data:', requestData)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
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

      <Input
        label="Audio URL (optional)"
        type="url"
        value={audioUrl}
        onChange={(e) => setAudioUrl(e.target.value)}
        placeholder="https://example.com/audio.mp3"
        help="Enter a URL to an MP3 file to add an audio player to this article"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Parent Article (optional - for sub-articles)
        </label>
        <select
          value={parentId || ''}
          onChange={(e) => setParentId(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">None (Main Article)</option>
          {availableArticles?.map((article) => (
            <option key={article.id} value={article.id}>
              {article.title}
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