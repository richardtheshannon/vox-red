'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@/app/components/ui/Button'
import DocsList from '@/app/components/admin/DocsList'

interface Documentation {
  id: string
  title: string
  subtitle?: string | null
  orderPosition: number
  updatedAt: Date
  parentId?: string | null
  subDocs?: Documentation[]
}

interface DocsPageClientProps {
  initialDocs: Documentation[]
}

export default function DocsPageClient({ initialDocs }: DocsPageClientProps) {
  const [docs, setDocs] = useState(initialDocs)

  // Refresh docs when initial data changes
  useEffect(() => {
    setDocs(initialDocs)
  }, [initialDocs])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Documentation Repository
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage internal documentation and guides
          </p>
        </div>
        <Link href="/admin/docs/new">
          <Button>Create New Doc</Button>
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Documentation Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Get started by creating your first documentation article.
          </p>
          <Link href="/admin/docs/new">
            <Button>Create First Doc</Button>
          </Link>
        </div>
      ) : (
        <DocsList initialDocs={docs} />
      )}
    </div>
  )
}