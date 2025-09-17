import { auth } from '@/app/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/app/lib/database'
import AdminLayout from '@/app/components/ui/AdminLayout'
import DocsPageClient from './DocsPageClient'

export default async function DocsPage() {
  const session = await auth()

  if (!session) {
    redirect('/admin/login')
  }

  // Fetch all main documentation with sub-docs
  const documentation = await prisma.documentation.findMany({
    where: {
      parentId: null,
    },
    orderBy: { orderPosition: 'asc' },
    include: {
      subDocs: {
        orderBy: { orderPosition: 'asc' }
      }
    }
  })

  return (
    <AdminLayout>
      <DocsPageClient initialDocs={documentation} />
    </AdminLayout>
  )
}