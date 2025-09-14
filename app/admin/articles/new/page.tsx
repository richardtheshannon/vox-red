import AdminLayout from '@/app/components/ui/AdminLayout'
import ArticleForm from '@/app/components/admin/ArticleForm'

export default function NewArticlePage() {
  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Article</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <ArticleForm />
        </div>
      </div>
    </AdminLayout>
  )
}