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
    rowBackgroundColor?: string | null
    rowPublishTimeStart?: string | null
    rowPublishTimeEnd?: string | null
    rowPublishDays?: string | null
    publishTimeStart?: string | null
    publishTimeEnd?: string | null
    publishDays?: string | null
    isChallenge?: boolean
    challengeDuration?: number | null
    challengeStartDate?: Date | string | null
    challengeEndDate?: Date | string | null
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
  const [rowBackgroundColor, setRowBackgroundColor] = useState(article?.rowBackgroundColor || '')
  const [rowPublishTimeStart, setRowPublishTimeStart] = useState(article?.rowPublishTimeStart || '')
  const [rowPublishTimeEnd, setRowPublishTimeEnd] = useState(article?.rowPublishTimeEnd || '')
  const [rowPublishDays, setRowPublishDays] = useState(article?.rowPublishDays || '')
  const [rowSelectedDays, setRowSelectedDays] = useState<string[]>(() => {
    if (article?.rowPublishDays && article.rowPublishDays !== 'all') {
      try {
        return JSON.parse(article.rowPublishDays)
      } catch {
        return []
      }
    }
    return []
  })
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

  // Challenge fields
  const [isChallenge, setIsChallenge] = useState(article?.isChallenge || false)
  const [challengeDuration, setChallengeDuration] = useState<number>(article?.challengeDuration || 30)
  const [challengeStartDate, setChallengeStartDate] = useState<string>(() => {
    if (article?.challengeStartDate) {
      const date = new Date(article.challengeStartDate)
      return date.toISOString().split('T')[0]
    }
    return ''
  })
  const [challengeEndDate, setChallengeEndDate] = useState<string>(() => {
    if (article?.challengeEndDate) {
      const date = new Date(article.challengeEndDate)
      return date.toISOString().split('T')[0]
    }
    return ''
  })

  // Auto-calculate end date when start date or duration changes
  useEffect(() => {
    if (isChallenge && challengeStartDate) {
      const start = new Date(challengeStartDate)
      const end = new Date(start)
      end.setDate(start.getDate() + challengeDuration - 1)
      setChallengeEndDate(end.toISOString().split('T')[0])
    }
  }, [challengeStartDate, challengeDuration, isChallenge])

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

  // Handle row background color change (for main articles only)
  const handleRowBackgroundColorChange = async (color: string) => {
    if (article && !article.parentId) { // Only for main articles
      try {
        const response = await fetch(`/api/articles/${article.id}/row-background-color`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rowBackgroundColor: color || null }),
        })

        if (response.ok) {
          setRowBackgroundColor(color)
        }
      } catch (error) {
        console.error('Error updating row background color:', error)
      }
    }
  }

  // Handle row day selection changes
  const handleRowDayChange = async (value: string) => {
    if (!article || article.parentId) return // Only for main articles

    let newDays: string[]
    let newPublishDays: string

    if (value === 'all') {
      newDays = []
      newPublishDays = 'all'
    } else {
      newDays = rowSelectedDays.includes(value)
        ? rowSelectedDays.filter(day => day !== value)
        : [...rowSelectedDays, value]
      newPublishDays = newDays.length === 0 ? 'all' : JSON.stringify(newDays)
    }

    setRowSelectedDays(newDays)
    setRowPublishDays(newPublishDays)

    try {
      const response = await fetch(`/api/articles/${article.id}/row-publishing`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rowPublishTimeStart: rowPublishTimeStart || null,
          rowPublishTimeEnd: rowPublishTimeEnd || null,
          rowPublishDays: newPublishDays || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update row publishing settings')
      }
    } catch (error) {
      console.error('Error updating row day settings:', error)
      // Revert on error
      setRowSelectedDays(rowSelectedDays)
      setRowPublishDays(rowPublishDays)
    }
  }

  // Handle row time changes
  const handleRowTimeChange = async (field: 'start' | 'end', value: string) => {
    if (!article || article.parentId) return // Only for main articles

    const newStartTime = field === 'start' ? value : rowPublishTimeStart
    const newEndTime = field === 'end' ? value : rowPublishTimeEnd

    if (field === 'start') {
      setRowPublishTimeStart(value)
    } else {
      setRowPublishTimeEnd(value)
    }

    try {
      const response = await fetch(`/api/articles/${article.id}/row-publishing`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rowPublishTimeStart: newStartTime || null,
          rowPublishTimeEnd: newEndTime || null,
          rowPublishDays: rowPublishDays || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update row publishing settings')
      }
    } catch (error) {
      console.error('Error updating row time settings:', error)
      // Revert on error
      if (field === 'start') {
        setRowPublishTimeStart(rowPublishTimeStart)
      } else {
        setRowPublishTimeEnd(rowPublishTimeEnd)
      }
    }
  }

  // Handle subtitle change for main articles - sync to all sub-articles
  const handleSubtitleChange = async (value: string) => {
    setSubtitle(value)

    // Only sync for main articles that are already saved
    if (article && !article.parentId) {
      try {
        const response = await fetch(`/api/articles/${article.id}/row-subtitle`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subtitle: value || null }),
        })

        if (!response.ok) {
          console.error('Failed to sync subtitle to sub-articles')
        }
      } catch (error) {
        console.error('Error syncing subtitle:', error)
      }
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
        published: true, // Ensure new articles are published by default
        publishTimeStart: publishTimeStart || null,
        publishTimeEnd: publishTimeEnd || null,
        publishDays: publishDays || null,
        isChallenge: parentId ? false : isChallenge, // Only main articles can be challenges
        challengeDuration: isChallenge ? challengeDuration : null,
        challengeStartDate: isChallenge && challengeStartDate ? new Date(challengeStartDate).toISOString() : null,
        challengeEndDate: isChallenge && challengeEndDate ? new Date(challengeEndDate).toISOString() : null,
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
            label={article && !article.parentId ? "Subtitle (optional - syncs to all articles in row)" : "Subtitle (optional)"}
            value={subtitle}
            onChange={(e) => handleSubtitleChange(e.target.value)}
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

            {/* Row Publishing Settings - Only for main articles */}
            {article && !article.parentId && (
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Row Publishing Settings
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Row Background Color (optional)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={rowBackgroundColor || '#ffffff'}
                      onChange={(e) => handleRowBackgroundColorChange(e.target.value)}
                      className="w-12 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={rowBackgroundColor || ''}
                      onChange={(e) => handleRowBackgroundColorChange(e.target.value)}
                      placeholder="Hex color (e.g., #FF5733)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    {rowBackgroundColor && (
                      <button
                        type="button"
                        onClick={() => handleRowBackgroundColorChange('')}
                        className="px-2 py-1 text-sm text-gray-500 hover:text-red-500"
                        title="Clear color"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Sets background color for this row in the admin articles list
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Row Time Window (optional)
                  </label>
                  <div className="space-y-3">
                    <Input
                      label="Start Time"
                      type="time"
                      value={rowPublishTimeStart}
                      onChange={(e) => handleRowTimeChange('start', e.target.value)}
                      placeholder="05:00"
                      help="Entire row will only be visible after this time"
                    />
                    <Input
                      label="End Time"
                      type="time"
                      value={rowPublishTimeEnd}
                      onChange={(e) => handleRowTimeChange('end', e.target.value)}
                      placeholder="10:00"
                      help="Entire row will only be visible before this time"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Row Allowed Days
                  </label>
                  <div className="space-y-2">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={rowSelectedDays.length === 0}
                          onChange={() => handleRowDayChange('all')}
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
                            checked={rowSelectedDays.includes(day.value)}
                            onChange={() => handleRowDayChange(day.value)}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{day.label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Time and day settings apply to the entire row (main article + all sub-articles)
                  </p>
                </div>
              </div>
            )}

            {/* Challenge Settings - Only for main articles */}
            {!parentId && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg space-y-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Challenge Settings
                </h3>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isChallenge}
                      onChange={(e) => setIsChallenge(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Is Challenge Row
                    </span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enable to make this a 30/60/90 day challenge with progress tracking
                  </p>
                </div>

                {isChallenge && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Challenge Duration
                      </label>
                      <div className="space-y-2">
                        {[30, 60, 90].map((days) => (
                          <label key={days} className="flex items-center">
                            <input
                              type="radio"
                              value={days}
                              checked={challengeDuration === days}
                              onChange={(e) => setChallengeDuration(Number(e.target.value))}
                              className="rounded-full border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                              {days} Days
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Input
                        label="Challenge Start Date"
                        type="date"
                        value={challengeStartDate}
                        onChange={(e) => setChallengeStartDate(e.target.value)}
                        required={isChallenge}
                        help="When the challenge period begins"
                      />
                    </div>

                    <div>
                      <Input
                        label="Challenge End Date (Auto-calculated)"
                        type="date"
                        value={challengeEndDate}
                        onChange={() => {}} // Read-only
                        disabled
                        help={`Automatically set to ${challengeDuration} days from start date`}
                      />
                    </div>

                    <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded text-xs text-yellow-800 dark:text-yellow-200">
                      <strong>Note:</strong> Sub-articles in this row will become challenge exercises.
                      Users can mark them complete with checkmark icons instead of stars.
                    </div>
                  </>
                )}
              </div>
            )}
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