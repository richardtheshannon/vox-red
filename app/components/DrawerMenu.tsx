'use client'

import { useRouter } from 'next/navigation'

interface DrawerMenuProps {
  onLogout: () => void
  onClose: () => void
}

export default function DrawerMenu({ onLogout, onClose }: DrawerMenuProps) {
  const router = useRouter()

  const handleLogoutClick = () => {
    onLogout()
    onClose()
  }

  const handleSettingsClick = () => {
    router.push('/admin/dashboard')
    onClose()
  }

  return (
    <div className="p-4">
      <div className="space-y-2">
        {/* Settings Link */}
        <button
          onClick={handleSettingsClick}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
        >
          <span className="material-icons text-gray-600 dark:text-gray-400">
            settings
          </span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">
            Settings
          </span>
        </button>

        {/* Logout Link */}
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
        >
          <span className="material-icons text-red-600 dark:text-red-400">
            logout
          </span>
          <span className="text-red-600 dark:text-red-400 font-medium">
            Logout
          </span>
        </button>
      </div>
    </div>
  )
}