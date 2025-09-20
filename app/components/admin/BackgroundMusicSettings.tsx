'use client';

import { useState, useEffect } from 'react';
import Button from '@/app/components/ui/Button';

export default function BackgroundMusicSettings() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings/background-music')
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          setUrl(data.url);
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const response = await fetch('/api/settings/background-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url || null }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save background music URL:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        Background Music Settings
      </h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="bg-music-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Background Music URL (MP3)
          </label>
          <input
            id="bg-music-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/music.mp3"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Leave empty to disable background music
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={loading}
            size="sm"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400">
              ✓ Settings saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}