import { auth } from '@/app/lib/auth'
import { redirect } from 'next/navigation'
import AdminLayout from '@/app/components/ui/AdminLayout'
import ArticleTypeColorSettings from '@/app/components/admin/ArticleTypeColorSettings'

export const dynamic = 'force-dynamic'

export default async function ThemePage() {
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Theme Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Customize the appearance and styling of your site
          </p>
        </div>

        <ArticleTypeColorSettings />
      </div>
    </AdminLayout>
  )
}