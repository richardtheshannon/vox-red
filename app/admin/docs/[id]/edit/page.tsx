import { auth } from '@/app/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/app/lib/database'
import DocForm from '@/app/components/admin/DocForm'

export default async function EditDocPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  const doc = await prisma.documentation.findUnique({
    where: { id },
  })

  if (!doc) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Edit Documentation
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Update the documentation article
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <DocForm doc={doc} />
      </div>
    </div>
  )
}