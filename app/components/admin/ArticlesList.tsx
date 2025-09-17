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

  useEffect(() => {
    setArticles(initialArticles)
  }, [initialArticles])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination } = result

    // Handle main article reordering
    if (source.droppableId === 'articles' && destination.droppableId === 'articles') {
      const items = Array.from(articles)
      const [reorderedItem] = items.splice(source.index, 1)
      items.splice(destination.index, 0, reorderedItem)

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

    // Handle sub-article reordering
    if (source.droppableId.startsWith('sub-') && destination.droppableId.startsWith('sub-')) {
      const parentId = source.droppableId.replace('sub-', '')

      if (source.droppableId === destination.droppableId) {
        // Reordering within the same parent
        const newArticles = articles.map(article => {
          if (article.id === parentId && article.subArticles) {
            const subItems = Array.from(article.subArticles)
            const [reorderedSubItem] = subItems.splice(source.index, 1)
            subItems.splice(destination.index, 0, reorderedSubItem)

            const updatedSubItems = subItems.map((subItem, index) => ({
              ...subItem,
              orderPosition: index,
            }))

            return {
              ...article,
              subArticles: updatedSubItems
            }
          }
          return article
        })

        setArticles(newArticles)
        setIsReordering(true)

        try {
          const parentArticle = newArticles.find(a => a.id === parentId)
          if (parentArticle?.subArticles) {
            const response = await fetch('/api/articles/reorder', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                articles: parentArticle.subArticles.map((item) => ({
                  id: item.id,
                  orderPosition: item.orderPosition,
                })),
              }),
            })

            if (!response.ok) {
              throw new Error('Failed to reorder sub-articles')
            }

            router.refresh()
          }
        } catch (error) {
          console.error('Error reordering sub-articles:', error)
          setArticles(initialArticles)
        } finally {
          setIsReordering(false)
        }
      }
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
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="articles" isDropDisabled={false} type="main-article">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`space-y-2 transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2' : ''
            }`}
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
                    className={`bg-white dark:bg-gray-800 p-4 rounded-lg border-2 transition-all ${
                      snapshot.isDragging
                        ? 'shadow-2xl scale-105 border-blue-500 bg-blue-50 dark:bg-blue-900/50 z-50'
                        : 'shadow border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    } ${isReordering ? 'opacity-50' : ''}`}
                    style={{
                      ...provided.draggableProps.style,
                      transform: snapshot.isDragging
                        ? `${provided.draggableProps.style?.transform} rotate(2deg)`
                        : provided.draggableProps.style?.transform,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Drag to reorder"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
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
                    {article.subArticles && article.subArticles.length > 0 && (
                      <div className="mt-3 ml-10 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                        <Droppable droppableId={`sub-${article.id}`} isDropDisabled={false} type="sub-article">
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`space-y-2 transition-colors min-h-[20px] ${
                                snapshot.isDraggingOver ? 'bg-green-50 dark:bg-green-900/20 rounded p-2' : ''
                              }`}
                            >
                              {article.subArticles?.map((subArticle, subIndex) => (
                                <Draggable
                                  key={subArticle.id}
                                  draggableId={`sub-${subArticle.id}`}
                                  index={subIndex}
                                  isDragDisabled={isReordering}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`bg-gray-50 dark:bg-gray-900 p-3 rounded border transition-all ${
                                        snapshot.isDragging
                                          ? 'shadow-xl border-green-500 bg-green-50 dark:bg-green-900/50 scale-102 z-40'
                                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                      } ${isReordering ? 'opacity-50' : ''}`}
                                      style={{
                                        ...provided.draggableProps.style,
                                        transform: snapshot.isDragging
                                          ? `${provided.draggableProps.style?.transform} rotate(1deg)`
                                          : provided.draggableProps.style?.transform,
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <div
                                            {...provided.dragHandleProps}
                                            className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                            title="Drag to reorder sub-article"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                            </svg>
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
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
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