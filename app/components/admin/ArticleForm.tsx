'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Input from '../ui/Input'
import Button from '../ui/Button'
import MediaSelector from './MediaSelector'
import { DAY_OPTIONS } from '../../lib/publishingUtils'

const TiptapEditor = dynamic(() => import('./TiptapEditor'), { ssr: false })

interface ArticleFormProps {
  article?: {
    id: string
    title: string
    subtitle?: string | null
    content: string | null
    audioUrl?: string | null
    mediaId?: string | null
    textAlign?: string
    verticalAlign?: string
    parentId?: string | null
    isProject?: boolean
    publishTimeStart?: string | null
    publishTimeEnd?: string | null
    publishDays?: string | null
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
  const [mediaId, setMediaId] = useState<string | null>(article?.mediaId || null)
  const [textAlign, setTextAlign] = useState(article?.textAlign || 'left')
  const [verticalAlign, setVerticalAlign] = useState(article?.verticalAlign || 'center')
  const [parentId, setParentId] = useState<string | null>(article?.parentId || null)
  const [publishTimeStart, setPublishTimeStart] = useState(article?.publishTimeStart || '')
  const [publishTimeEnd, setPublishTimeEnd] = useState(article?.publishTimeEnd || '')
  const [publishDays, setPublishDays] = useState(article?.publishDays || '')
  const [selectedDays, setSelectedDays] = useState<string[]>(() => {
    if (article?.publishDays && article.publishDays !== 'all') {
      try {
        return JSON.parse(article.publishDays)
      } catch {
        return []
      }
    }
    return []
  })
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

  // Handle media selection changes
  const handleMediaChange = (url: string | null, id: string | null) => {
    setAudioUrl(url || '')
    setMediaId(id)
  }

  // Handle day selection changes
  const handleDayChange = (value: string) => {
    if (value === 'all') {
      setSelectedDays([])
      setPublishDays('all')
    } else {
      const newDays = selectedDays.includes(value)
        ? selectedDays.filter(day => day !== value)
        : [...selectedDays, value]

      setSelectedDays(newDays)
      setPublishDays(newDays.length === 0 ? 'all' : JSON.stringify(newDays))
    }
  }

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
        mediaId: mediaId || null,
        textAlign,
        verticalAlign,
        parentId: parentId || null,
        publishTimeStart: publishTimeStart || null,
        publishTimeEnd: publishTimeEnd || null,
        publishDays: publishDays || null,
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
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

          <MediaSelector
            value={audioUrl}
            mediaId={mediaId}
            onChange={handleMediaChange}
            label="Audio File (optional)"
            help="Select an uploaded MP3 file, upload a new one, or paste a URL to add an audio player to this article"
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
        </div>

        {/* Publishing Settings Column - Available for all articles */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Publishing Settings
            </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Window (optional)
                </label>
                <div className="space-y-3">
                  <Input
                    label="Start Time"
                    type="time"
                    value={publishTimeStart}
                    onChange={(e) => setPublishTimeStart(e.target.value)}
                    placeholder="05:00"
                    help="Article will only be visible after this time"
                  />
                  <Input
                    label="End Time"
                    type="time"
                    value={publishTimeEnd}
                    onChange={(e) => setPublishTimeEnd(e.target.value)}
                    placeholder="10:00"
                    help="Article will only be visible before this time"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allowed Days
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedDays.length === 0}
                        onChange={() => handleDayChange('all')}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">All days</span>
                    </label>
                  </div>
                  {DAY_OPTIONS.slice(1).map((day) => (
                    <div key={day.value}>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedDays.includes(day.value)}
                          onChange={() => handleDayChange(day.value)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{day.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Leave all days unchecked to show article every day
                </p>
              </div>
            </div>
          </div>
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