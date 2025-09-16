'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { DropResult } from 'react-beautiful-dnd'

const DragDropContext = dynamic(
  () => import('react-beautiful-dnd').then(mod => mod.DragDropContext),
  { ssr: false }
)
const Droppable = dynamic(
  () => import('react-beautiful-dnd').then(mod => mod.Droppable),
  { ssr: false }
)
const Draggable = dynamic(
  () => import('react-beautiful-dnd').then(mod => mod.Draggable),
  { ssr: false }
)
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
}

interface ArticlesListProps {
  initialArticles: Article[]
}

export default function ArticlesList({ initialArticles }: ArticlesListProps) {
  const router = useRouter()
  const [articles, setArticles] = useState(initialArticles)
  const [isReordering, setIsReordering] = useState(false)

  useEffect(() => {
    setArticles(initialArticles)
  }, [initialArticles])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(articles)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const updatedItems = items.map((item, index) => ({
      ...item,
      orderPosition: index,
    }))

    setArticles(updatedItems)
    setIsReordering(true)

    try {
      const response = await fetch('/api/articles/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articles: updatedItems.map((item) => ({
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

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="articles" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {articles.map((article, index) => (
              <Draggable
                key={article.id}
                draggableId={article.id}
                index={index}
                isDragDisabled={isReordering}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow ${
                      snapshot.isDragging ? 'shadow-lg opacity-90' : ''
                    } ${isReordering ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-move text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{article.title}</h3>
                          {article.subtitle && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{article.subtitle}</p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Updated {new Date(article.updatedAt).toLocaleDateString()}
                            {article.subArticles && article.subArticles.length > 0 && (
                              <span className="ml-2 text-blue-600 dark:text-blue-400">
                                • {article.subArticles.length} sub-article{article.subArticles.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
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
                    {article.subArticles && article.subArticles.length > 0 && (
                      <div className="mt-3 ml-10 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                        {article.subArticles.map((subArticle) => (
                          <div key={subArticle.id} className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                  {subArticle.title}
                                </h4>
                                {subArticle.subtitle && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{subArticle.subtitle}</p>
                                )}
                              </div>
                              <div className="flex space-x-2">
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
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}