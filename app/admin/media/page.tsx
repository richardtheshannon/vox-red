import { auth } from '@/app/lib/auth'
import { redirect } from 'next/navigation'
import AdminLayout from '@/app/components/ui/AdminLayout'
import AdminMediaManager from './AdminMediaManager'

export const dynamic = 'force-dynamic'

export default async function AdminMediaPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/admin/login')
  }

  return (
    <AdminLayout>
      <AdminMediaManager />
    </AdminLayout>
  )
}