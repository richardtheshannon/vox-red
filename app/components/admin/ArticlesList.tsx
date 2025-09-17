'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '../ui/Button'
import { useRouter } from 'next/navigation'

interface Article {
  id: string
  title: string
  subtitle?: string | null
  orderPosition: number
  updatedAt: Date
  parentId?: string | null
  subArticles?: Article[]
  published?: boolean
  isProject?: boolean
}

interface ArticlesListProps {
  initialArticles: Article[]
}

export default function ArticlesList({ initialArticles }: ArticlesListProps) {
  const router = useRouter()
  const [articles, setArticles] = useState(initialArticles)
  const [isReordering, setIsReordering] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    setArticles(initialArticles)
  }, [initialArticles])

  useEffect(() => {
    // Load collapsed state from sessionStorage or default to all collapsed
    const storedState = sessionStorage.getItem('articlesCollapsedState')
    if (storedState) {
      setCollapsedGroups(new Set(JSON.parse(storedState)))
    } else {
      // Start with all articles that have sub-articles collapsed
      const articlesWithSubArticles = initialArticles
        .filter(article => article.subArticles && article.subArticles.length > 0)
        .map(article => article.id)
      setCollapsedGroups(new Set(articlesWithSubArticles))
    }
  }, [initialArticles])

  const toggleGroup = (articleId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(articleId)) {
        newSet.delete(articleId)
      } else {
        newSet.add(articleId)
      }
      // Save to sessionStorage
      sessionStorage.setItem('articlesCollapsedState', JSON.stringify(Array.from(newSet)))
      return newSet
    })
  }

  const moveArticle = async (articleId: string, direction: 'up' | 'down') => {
    const currentIndex = articles.findIndex(a => a.id === articleId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= articles.length) return

    const newArticles = [...articles]
    const [movedArticle] = newArticles.splice(currentIndex, 1)
    newArticles.splice(newIndex, 0, movedArticle)

    const updatedArticles = newArticles.map((article, index) => ({
      ...article,
      orderPosition: index,
    }))

    setArticles(updatedArticles)
    setIsReordering(true)

    try {
      const response = await fetch('/api/articles/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articles: updatedArticles.map((item) => ({
            id: item.id,
            orderPosition: item.orderPosition,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder articles')
      }

      router.refresh()
    } catch (error) {
      console.error('Error reordering articles:', error)
      setArticles(initialArticles)
    } finally {
      setIsReordering(false)
    }
  }

  const moveSubArticle = async (parentId: string, subArticleId: string, direction: 'up' | 'down') => {
    const parentArticle = articles.find(a => a.id === parentId)
    if (!parentArticle?.subArticles) return

    const currentIndex = parentArticle.subArticles.findIndex(sa => sa.id === subArticleId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= parentArticle.subArticles.length) return

    const newSubArticles = [...parentArticle.subArticles]
    const [movedSubArticle] = newSubArticles.splice(currentIndex, 1)
    newSubArticles.splice(newIndex, 0, movedSubArticle)

    const updatedSubArticles = newSubArticles.map((subArticle, index) => ({
      ...subArticle,
      orderPosition: index,
    }))

    const newArticles = articles.map(article =>
      article.id === parentId
        ? { ...article, subArticles: updatedSubArticles }
        : article
    )

    setArticles(newArticles)
    setIsReordering(true)

    try {
      const response = await fetch('/api/articles/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articles: updatedSubArticles.map((item) => ({
            id: item.id,
            orderPosition: item.orderPosition,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder sub-articles')
      }

      router.refresh()
    } catch (error) {
      console.error('Error reordering sub-articles:', error)
      setArticles(initialArticles)
    } finally {
      setIsReordering(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete article')
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting article:', error)
    }
  }

  const handlePublishToggle = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/articles/${id}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ published: !currentStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update publish status')
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating publish status:', error)
    }
  }

  return (
    <div className="space-y-2">
      {articles.map((article, index) => (
        <div
          key={article.id}
          className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow border hover:border-gray-300 dark:hover:border-gray-600 transition-all ${
            isReordering ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col space-y-1">
                <button
                  onClick={() => moveArticle(article.id, 'up')}
                  disabled={index === 0 || isReordering}
                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveArticle(article.id, 'down')}
                  disabled={index === articles.length - 1 || isReordering}
                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move down"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {article.subArticles && article.subArticles.length > 0 && (
                              <button
                                onClick={() => toggleGroup(article.id)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                title={collapsedGroups.has(article.id) ? 'Expand group' : 'Collapse group'}
                              >
                                <svg className="w-4 h-4 transition-transform" style={{
                                  transform: collapsedGroups.has(article.id) ? 'rotate(-90deg)' : 'rotate(0deg)'
                                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            )}
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{article.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              article.published
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {article.published ? 'Published' : 'Unpublished'}
                            </span>
                            {article.isProject && (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Project
                              </span>
                            )}
                          </div>
                          {article.subtitle && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{article.subtitle}</p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Updated {new Date(article.updatedAt).toLocaleDateString()}
                            {article.subArticles && article.subArticles.length > 0 && (
                              <span className="ml-2 text-blue-600 dark:text-blue-400">
                                • {article.subArticles.length} sub-article{article.subArticles.length > 1 ? 's' : ''}
                                ({collapsedGroups.has(article.id) ? 'collapsed' : 'expanded'})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <select
                          value={article.published ? 'published' : 'unpublished'}
                          onChange={() => handlePublishToggle(article.id, article.published || false)}
                          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="published">Published</option>
                          <option value="unpublished">Unpublished</option>
                        </select>
                        <Link href={`/admin/articles/${article.id}/edit`}>
                          <Button variant="secondary" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(article.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    {/* Sub-articles section */}
                    {article.subArticles && article.subArticles.length > 0 && !collapsedGroups.has(article.id) && (
                      <div className="mt-3 ml-10 border-l-2 border-gray-200 dark:border-gray-700 pl-4 space-y-2">
                        {article.subArticles?.map((subArticle, subIndex) => (
                          <div
                            key={subArticle.id}
                            className={`bg-gray-50 dark:bg-gray-900 p-3 rounded border hover:border-gray-300 dark:hover:border-gray-600 transition-all ${
                              isReordering ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="flex flex-col space-y-1">
                                  <button
                                    onClick={() => moveSubArticle(article.id, subArticle.id, 'up')}
                                    disabled={subIndex === 0 || isReordering}
                                    className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Move up"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => moveSubArticle(article.id, subArticle.id, 'down')}
                                    disabled={subIndex === (article.subArticles?.length || 0) - 1 || isReordering}
                                    className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Move down"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                </div>
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                              <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                {subArticle.title}
                                              </h4>
                                              <span className={`px-2 py-1 text-xs rounded-full ${
                                                subArticle.published
                                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                              }`}>
                                                {subArticle.published ? 'Published' : 'Unpublished'}
                                              </span>
                                            </div>
                                            {subArticle.subtitle && (
                                              <p className="text-xs text-gray-500 dark:text-gray-400">{subArticle.subtitle}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex space-x-2">
                                          <select
                                            value={subArticle.published ? 'published' : 'unpublished'}
                                            onChange={() => handlePublishToggle(subArticle.id, subArticle.published || false)}
                                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                          >
                                            <option value="published">Published</option>
                                            <option value="unpublished">Unpublished</option>
                                          </select>
                                          <Link href={`/admin/articles/${subArticle.id}/edit`}>
                                            <Button variant="secondary" size="sm">Edit</Button>
                                          </Link>
                                          <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(subArticle.id)}
                                          >
                                            Delete
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
}