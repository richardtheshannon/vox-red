import Link from 'next/link'
import Button from './components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full">
              Return Home
            </Button>
          </Link>
          
          <Link href="/admin/login">
            <Button variant="secondary" className="w-full">
              Admin Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}