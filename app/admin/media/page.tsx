import { auth } from '@/app/lib/auth'
import { redirect } from 'next/navigation'
import AdminMediaManager from './AdminMediaManager'

export const dynamic = 'force-dynamic'

export default async function AdminMediaPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AdminMediaManager />
    </div>
  )
}