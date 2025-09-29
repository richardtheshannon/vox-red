import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'

export const dynamic = 'force-dynamic'

const DARK_SETTINGS_KEY = 'article_type_colors'
const LIGHT_SETTINGS_KEY = 'article_type_colors_light'

const defaultDarkColors = {
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

const defaultLightColors = {
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

export async function GET() {
  try {
    const [darkSetting, lightSetting] = await Promise.all([
      prisma.settings.findUnique({ where: { key: DARK_SETTINGS_KEY } }),
      prisma.settings.findUnique({ where: { key: LIGHT_SETTINGS_KEY } })
    ])

    // Convert old format to new format if needed
    let darkColors = defaultDarkColors
    let lightColors = defaultLightColors

    if (darkSetting?.value) {
      const parsed = JSON.parse(darkSetting.value)
      // Check if it's old format (string values) or new format (object values)
      if (typeof parsed.meditation === 'string') {
        // Old format - convert to new
        const articleTypes = ['meditation', 'education', 'personal', 'spiritual', 'routine', 'notSet'] as const
        const converted: any = {}
        articleTypes.forEach(type => {
          converted[type] = {
            background: parsed[type] || defaultDarkColors[type].background,
            heading: defaultDarkColors[type].heading,
            subHeading: defaultDarkColors[type].subHeading,
            content: defaultDarkColors[type].content
          }
        })
        darkColors = converted
      } else {
        darkColors = parsed
      }
    }

    if (lightSetting?.value) {
      const parsed = JSON.parse(lightSetting.value)
      // Check if it's old format (string values) or new format (object values)
      if (typeof parsed.meditation === 'string') {
        // Old format - convert to new
        const articleTypes = ['meditation', 'education', 'personal', 'spiritual', 'routine', 'notSet'] as const
        const converted: any = {}
        articleTypes.forEach(type => {
          converted[type] = {
            background: parsed[type] || defaultLightColors[type].background,
            heading: defaultLightColors[type].heading,
            subHeading: defaultLightColors[type].subHeading,
            content: defaultLightColors[type].content
          }
        })
        lightColors = converted
      } else {
        lightColors = parsed
      }
    }

    return NextResponse.json({
      dark: darkColors,
      light: lightColors
    })
  } catch (error) {
    console.error('Error fetching article type colors:', error)
    return NextResponse.json({
      dark: defaultDarkColors,
      light: defaultLightColors
    })
  }
}