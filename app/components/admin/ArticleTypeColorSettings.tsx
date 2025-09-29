'use client'

import { useState, useEffect } from 'react'

interface ColorSettings {
  meditation: {
    background: string
    heading: string
    subHeading: string
    content: string
  }
  education: {
    background: string
    heading: string
    subHeading: string
    content: string
  }
  personal: {
    background: string
    heading: string
    subHeading: string
    content: string
  }
  spiritual: {
    background: string
    heading: string
    subHeading: string
    content: string
  }
  routine: {
    background: string
    heading: string
    subHeading: string
    content: string
  }
  notSet: {
    background: string
    heading: string
    subHeading: string
    content: string
  }
}

interface AllColorSettings {
  dark: ColorSettings
  light: ColorSettings
}

const defaultDarkColors: ColorSettings = {
  meditation: {
    background: '#250902',
    heading: '#fbbf24',
    subHeading: '#fcd34d',
    content: '#e5e7eb'
  },
  education: {
    background: '#38040e',
    heading: '#f9a8d4',
    subHeading: '#fbcfe8',
    content: '#e5e7eb'
  },
  personal: {
    background: '#640d14',
    heading: '#fca5a5',
    subHeading: '#fecaca',
    content: '#e5e7eb'
  },
  spiritual: {
    background: '#333333',
    heading: '#d4d4d8',
    subHeading: '#e4e4e7',
    content: '#e5e7eb'
  },
  routine: {
    background: '#800e13',
    heading: '#f9a8d4',
    subHeading: '#fbcfe8',
    content: '#e5e7eb'
  },
  notSet: {
    background: '#ad2831',
    heading: '#fca5a5',
    subHeading: '#fecaca',
    content: '#e5e7eb'
  }
}

const defaultLightColors: ColorSettings = {
  meditation: {
    background: '#f0e6e0',
    heading: '#92400e',
    subHeading: '#78350f',
    content: '#1f2937'
  },
  education: {
    background: '#f5e0e5',
    heading: '#831843',
    subHeading: '#9f1239',
    content: '#1f2937'
  },
  personal: {
    background: '#fde2e4',
    heading: '#991b1b',
    subHeading: '#b91c1c',
    content: '#1f2937'
  },
  spiritual: {
    background: '#e8e8e8',
    heading: '#374151',
    subHeading: '#4b5563',
    content: '#1f2937'
  },
  routine: {
    background: '#ffd7db',
    heading: '#831843',
    subHeading: '#9f1239',
    content: '#1f2937'
  },
  notSet: {
    background: '#ffc9cc',
    heading: '#991b1b',
    subHeading: '#b91c1c',
    content: '#1f2937'
  }
}

export default function ArticleTypeColorSettings() {
  const [colors, setColors] = useState<AllColorSettings>({
    dark: defaultDarkColors,
    light: defaultLightColors
  })
  const [activeTab, setActiveTab] = useState<'dark' | 'light'>('dark')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchColors()
  }, [])

  const fetchColors = async () => {
    try {
      const response = await fetch('/api/settings/article-type-colors')
      if (response.ok) {
        const data = await response.json()
        if (data.colors) {
          // Old format - single color set (dark mode) - convert to new format
          const oldColors = data.colors
          const convertedDark: ColorSettings = {} as ColorSettings
          const articleTypes = ['meditation', 'education', 'personal', 'spiritual', 'routine', 'notSet'] as const

          articleTypes.forEach(type => {
            convertedDark[type] = {
              background: oldColors[type] || defaultDarkColors[type].background,
              heading: defaultDarkColors[type].heading,
              subHeading: defaultDarkColors[type].subHeading,
              content: defaultDarkColors[type].content
            }
          })

          setColors({
            dark: convertedDark,
            light: defaultLightColors
          })
        } else if (data.dark && data.light) {
          // Check if it's the new format with nested color objects
          const firstType = data.dark.meditation
          if (typeof firstType === 'string') {
            // Old format stored as dark/light - convert to new format
            const convertedDark: ColorSettings = {} as ColorSettings
            const convertedLight: ColorSettings = {} as ColorSettings
            const articleTypes = ['meditation', 'education', 'personal', 'spiritual', 'routine', 'notSet'] as const

            articleTypes.forEach(type => {
              convertedDark[type] = {
                background: data.dark[type] || defaultDarkColors[type].background,
                heading: defaultDarkColors[type].heading,
                subHeading: defaultDarkColors[type].subHeading,
                content: defaultDarkColors[type].content
              }
              convertedLight[type] = {
                background: data.light[type] || defaultLightColors[type].background,
                heading: defaultLightColors[type].heading,
                subHeading: defaultLightColors[type].subHeading,
                content: defaultLightColors[type].content
              }
            })

            setColors({
              dark: convertedDark,
              light: convertedLight
            })
          } else {
            // New format - use as is
            setColors({
              dark: data.dark,
              light: data.light
            })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching colors:', error)
    }
  }

  const handleColorChange = (
    theme: 'dark' | 'light',
    type: keyof ColorSettings,
    field: 'background' | 'heading' | 'subHeading' | 'content',
    value: string
  ) => {
    setColors(prev => ({
      ...prev,
      [theme]: {
        ...prev[theme],
        [type]: {
          ...prev[theme][type],
          [field]: value
        }
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/settings/article-type-colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ colors: colors.dark, lightColors: colors.light }),
      })

      if (response.ok) {
        setMessage('Colors saved successfully')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to save colors')
      }
    } catch (error) {
      console.error('Error saving colors:', error)
      setMessage('Error saving colors')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (activeTab === 'dark') {
      setColors(prev => ({
        ...prev,
        dark: defaultDarkColors
      }))
    } else {
      setColors(prev => ({
        ...prev,
        light: defaultLightColors
      }))
    }
  }

  const handleSetNeutral = () => {
    const neutralColors = {
      background: '#212121',
      heading: '#878787',
      subHeading: '#878787',
      content: '#737373'
    }

    const neutralSettings: ColorSettings = {
      meditation: neutralColors,
      education: neutralColors,
      personal: neutralColors,
      spiritual: neutralColors,
      routine: neutralColors,
      notSet: neutralColors
    }

    if (activeTab === 'dark') {
      setColors(prev => ({
        ...prev,
        dark: neutralSettings
      }))
    } else {
      setColors(prev => ({
        ...prev,
        light: neutralSettings
      }))
    }
  }

  const articleTypes = [
    { key: 'meditation', label: 'Meditation', icon: '🧘' },
    { key: 'education', label: 'Education', icon: '📚' },
    { key: 'personal', label: 'Personal', icon: '👤' },
    { key: 'spiritual', label: 'Spiritual', icon: '✨' },
    { key: 'routine', label: 'Routine', icon: '🔄' },
    { key: 'notSet', label: 'Not Set', icon: '❓' }
  ]

  const colorFields = [
    { key: 'background', label: 'Background' },
    { key: 'heading', label: 'Heading' },
    { key: 'subHeading', label: 'Sub-Heading' },
    { key: 'content', label: 'Content Text' }
  ] as const

  const currentColors = activeTab === 'dark' ? colors.dark : colors.light

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Article Type Colors
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Customize colors for each article type
          </p>
        </div>

        {/* Tab selector */}
        <div className="px-6 pt-4 pb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 max-w-md">
            <button
              onClick={() => setActiveTab('dark')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'dark'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              🌙 Dark Mode
            </button>
            <button
              onClick={() => setActiveTab('light')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'light'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              ☀️ Light Mode
            </button>
          </div>
        </div>
      </div>

      {/* Color cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {articleTypes.map(({ key, label, icon }) => (
          <div key={key} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="px-6 py-4 border-b dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                <span className="mr-2 text-lg">{icon}</span>
                {label}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {colorFields.map(({ key: fieldKey, label: fieldLabel }) => (
                <div key={fieldKey} className="flex items-center space-x-3">
                  <label className="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {fieldLabel}:
                  </label>
                  <input
                    type="color"
                    value={currentColors[key as keyof ColorSettings][fieldKey]}
                    onChange={(e) => handleColorChange(activeTab, key as keyof ColorSettings, fieldKey, e.target.value)}
                    className="h-9 w-20 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentColors[key as keyof ColorSettings][fieldKey]}
                    onChange={(e) => handleColorChange(activeTab, key as keyof ColorSettings, fieldKey, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="#000000"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                  <div
                    className="w-9 h-9 rounded border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
                    style={{
                      backgroundColor: fieldKey === 'background'
                        ? currentColors[key as keyof ColorSettings][fieldKey]
                        : currentColors[key as keyof ColorSettings].background,
                      color: currentColors[key as keyof ColorSettings][fieldKey]
                    }}
                    title={`Preview: ${currentColors[key as keyof ColorSettings][fieldKey]}`}
                  >
                    {fieldKey !== 'background' && (
                      <span className="text-xs flex items-center justify-center h-full font-bold">
                        {fieldKey === 'heading' ? 'H' : fieldKey === 'subHeading' ? 'S' : 'T'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-3 max-w-3xl">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
          >
            {saving ? 'Saving...' : 'Save All Colors'}
          </button>

          <button
            onClick={handleSetNeutral}
            className="flex-1 px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Set All to Neutral Gray
          </button>

          <button
            onClick={handleReset}
            className="flex-1 px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Reset to Theme Defaults
          </button>
        </div>

        {message && (
          <div className={`mt-4 p-3 text-sm rounded-md max-w-3xl ${
            message.includes('success')
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}