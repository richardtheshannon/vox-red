import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  console.log('Seeding with admin email:', adminEmail)
  console.log('Password length:', adminPassword.length)

  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
    },
  })

  console.log('Admin user upserted successfully:', user.email)

  // Seed default background music URL
  await prisma.settings.upsert({
    where: { key: 'background_music_url' },
    update: {},
    create: {
      key: 'background_music_url',
      value: 'https://vox.red/mp3/_backing-tracks/X_backing-track-02.mp3',
    },
  })

  const articlesCount = await prisma.article.count()
  
  if (articlesCount === 0) {
    const sampleArticles = [
      {
        title: 'Welcome to Our CMS',
        subtitle: 'Get started with content management',
        content: '<p>This is your first article. You can edit or delete it from the admin dashboard.</p>',
        orderPosition: 0,
      },
      {
        title: 'Features Overview',
        subtitle: 'What you can do with this CMS',
        content: '<p>Manage articles, reorder content with drag and drop, and see real-time updates.</p>',
        orderPosition: 1,
      },
      {
        title: 'Mobile-First Design',
        subtitle: 'Optimized for all devices',
        content: '<p>Our slider interface works perfectly on mobile, tablet, and desktop devices.</p>',
        orderPosition: 2,
      },
    ]

    for (const article of sampleArticles) {
      await prisma.article.create({ data: article })
    }

    console.log('Sample articles created')
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })