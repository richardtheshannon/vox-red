'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '../ui/Button'
import { useRouter } from 'next/navigation'

interface Documentation {
  id: string
  title: string
  subtitle?: string | null
  orderPosition: number
  updatedAt: Date
  parentId?: string | null
  subDocs?: Documentation[]
}

interface DocsListProps {
  initialDocs: Documentation[]
}

export default function DocsList({ initialDocs }: DocsListProps) {
  const router = useRouter()
  const [docs, setDocs] = useState(initialDocs)
  const [isReordering, setIsReordering] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    setDocs(initialDocs)
  }, [initialDocs])

  const toggleGroup = (docId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(docId)) {
        newSet.delete(docId)
      } else {
        newSet.add(docId)
      }
      return newSet
    })
  }

  const moveDoc = async (docId: string, direction: 'up' | 'down') => {
    const currentIndex = docs.findIndex(d => d.id === docId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= docs.length) return

    const newDocs = [...docs]
    const [movedDoc] = newDocs.splice(currentIndex, 1)
    newDocs.splice(newIndex, 0, movedDoc)

    const updatedDocs = newDocs.map((doc, index) => ({
      ...doc,
      orderPosition: index,
    }))

    setDocs(updatedDocs)
    setIsReordering(true)

    try {
      const response = await fetch('/api/docs/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docs: updatedDocs.map((item) => ({
            id: item.id,
            orderPosition: item.orderPosition,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder documentation')
      }

      router.refresh()
    } catch (error) {
      console.error('Error reordering documentation:', error)
      setDocs(initialDocs)
    } finally {
      setIsReordering(false)
    }
  }

  const moveSubDoc = async (parentId: string, subDocId: string, direction: 'up' | 'down') => {
    const parentDoc = docs.find(d => d.id === parentId)
    if (!parentDoc?.subDocs) return

    const currentIndex = parentDoc.subDocs.findIndex(sd => sd.id === subDocId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= parentDoc.subDocs.length) return

    const newSubDocs = [...parentDoc.subDocs]
    const [movedSubDoc] = newSubDocs.splice(currentIndex, 1)
    newSubDocs.splice(newIndex, 0, movedSubDoc)

    const updatedSubDocs = newSubDocs.map((subDoc, index) => ({
      ...subDoc,
      orderPosition: index,
    }))

    const newDocs = docs.map(doc =>
      doc.id === parentId
        ? { ...doc, subDocs: updatedSubDocs }
        : doc
    )

    setDocs(newDocs)
    setIsReordering(true)

    try {
      const response = await fetch('/api/docs/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docs: updatedSubDocs.map((item) => ({
            id: item.id,
            orderPosition: item.orderPosition,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder sub-documentation')
      }

      router.refresh()
    } catch (error) {
      console.error('Error reordering sub-documentation:', error)
      setDocs(initialDocs)
    } finally {
      setIsReordering(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this documentation?')) return

    try {
      const response = await fetch(`/api/docs/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete documentation')
      }

      router.refresh()
    } catch (error) {
      console.error('Error deleting documentation:', error)
    }
  }

  return (
    <div className="space-y-2">
      {docs.map((doc, index) => (
        <div
          key={doc.id}
          className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow border hover:border-gray-300 dark:hover:border-gray-600 transition-all ${
            isReordering ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col space-y-1">
                <button
                  onClick={() => moveDoc(doc.id, 'up')}
                  disabled={index === 0 || isReordering}
                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveDoc(doc.id, 'down')}
                  disabled={index === docs.length - 1 || isReordering}
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
                  {doc.subDocs && doc.subDocs.length > 0 && (
                    <button
                      onClick={() => toggleGroup(doc.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title={collapsedGroups.has(doc.id) ? 'Expand group' : 'Collapse group'}
                    >
                      <svg className="w-4 h-4 transition-transform" style={{
                        transform: collapsedGroups.has(doc.id) ? 'rotate(-90deg)' : 'rotate(0deg)'
                      }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{doc.title}</h3>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Documentation
                  </span>
                </div>
                {doc.subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{doc.subtitle}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Updated {new Date(doc.updatedAt).toLocaleDateString()}
                  {doc.subDocs && doc.subDocs.length > 0 && (
                    <span className="ml-2 text-blue-600 dark:text-blue-400">
                      • {doc.subDocs.length} sub-doc{doc.subDocs.length > 1 ? 's' : ''}
                      ({collapsedGroups.has(doc.id) ? 'collapsed' : 'expanded'})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link href={`/admin/docs/${doc.id}/view`}>
                <Button variant="primary" size="sm">
                  View
                </Button>
              </Link>
              <Link href={`/admin/docs/${doc.id}/edit`}>
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(doc.id)}
              >
                Delete
              </Button>
            </div>
          </div>
          {/* Sub-docs section */}
          {doc.subDocs && doc.subDocs.length > 0 && !collapsedGroups.has(doc.id) && (
            <div className="mt-3 ml-10 border-l-2 border-gray-200 dark:border-gray-700 pl-4 space-y-2">
              {doc.subDocs?.map((subDoc, subIndex) => (
                <div
                  key={subDoc.id}
                  className={`bg-gray-50 dark:bg-gray-900 p-3 rounded border hover:border-gray-300 dark:hover:border-gray-600 transition-all ${
                    isReordering ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => moveSubDoc(doc.id, subDoc.id, 'up')}
                          disabled={subIndex === 0 || isReordering}
                          className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveSubDoc(doc.id, subDoc.id, 'down')}
                          disabled={subIndex === (doc.subDocs?.length || 0) - 1 || isReordering}
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
                            {subDoc.title}
                          </h4>
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Sub-doc
                          </span>
                        </div>
                        {subDoc.subtitle && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{subDoc.subtitle}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/admin/docs/${subDoc.id}/view`}>
                        <Button variant="primary" size="sm">View</Button>
                      </Link>
                      <Link href={`/admin/docs/${subDoc.id}/edit`}>
                        <Button variant="secondary" size="sm">Edit</Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(subDoc.id)}
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