import { auth } from '@/app/lib/auth'
import { redirect } from 'next/navigation'
import DocForm from '@/app/components/admin/DocForm'

export default async function NewDocPage() {
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Create New Documentation
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Add a new documentation article to the repository
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <DocForm />
      </div>
    </div>
  )
}