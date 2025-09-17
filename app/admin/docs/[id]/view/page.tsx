import { auth } from '@/app/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/app/lib/database'
import AdminLayout from '@/app/components/ui/AdminLayout'
import Link from 'next/link'
import Button from '@/app/components/ui/Button'

export default async function ViewDocPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  if (!session) {
    redirect('/admin/login')
  }

  const doc = await prisma.documentation.findUnique({
    where: { id },
    include: {
      parent: true,
      subDocs: {
        orderBy: { orderPosition: 'asc' }
      }
    }
  })

  if (!doc) {
    redirect('/admin/docs')
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with navigation */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/admin/docs" className="hover:text-gray-900 dark:hover:text-gray-100">
                Documentation
              </Link>
              <span>/</span>
              {doc.parent && (
                <>
                  <Link
                    href={`/admin/docs/${doc.parent.id}/view`}
                    className="hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    {doc.parent.title}
                  </Link>
                  <span>/</span>
                </>
              )}
              <span className="text-gray-900 dark:text-gray-100">{doc.title}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {doc.title}
            </h1>
            {doc.subtitle && (
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {doc.subtitle}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Last updated: {new Date(doc.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <Link href={`/admin/docs/${id}/edit`}>
              <Button variant="secondary">Edit Document</Button>
            </Link>
            <Link href="/admin/docs">
              <Button variant="secondary">Back to Docs</Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-8">
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: doc.content }}
          />
        </div>

        {/* Sub-docs navigation */}
        {doc.subDocs && doc.subDocs.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Related Documents
            </h2>
            <div className="space-y-2">
              {doc.subDocs.map((subDoc) => (
                <Link
                  key={subDoc.id}
                  href={`/admin/docs/${subDoc.id}/view`}
                  className="block p-3 bg-white dark:bg-gray-700 rounded border dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {subDoc.title}
                      </h3>
                      {subDoc.subtitle && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {subDoc.subtitle}
                        </p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Parent doc link */}
        {doc.parent && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Parent Document
            </h2>
            <Link
              href={`/admin/docs/${doc.parent.id}/view`}
              className="block p-3 bg-white dark:bg-gray-700 rounded border dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {doc.parent.title}
                  </h3>
                  {doc.parent.subtitle && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {doc.parent.subtitle}
                    </p>
                  )}
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}