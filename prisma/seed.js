const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

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

  const articlesCount = await prisma.article.count()
  
  if (articlesCount === 0) {
    const sampleArticles = [
      {
        title: 'Welcome to Our CMS',
        subtitle: 'Get started with content management',
        content: '<p>This is your first article. You can edit or delete it from the admin dashboard.</p>',
        orderPosition: 1,
      },
      {
        title: 'Getting Started',
        subtitle: 'Learn how to use the platform',
        content: '<p>Navigate to the admin panel to manage your content. You can create, edit, and reorder articles using our intuitive interface.</p>',
        orderPosition: 2,
      },
      {
        title: 'Features',
        subtitle: 'Discover what you can do',
        content: '<p>Our CMS offers drag-and-drop article ordering, rich text editing, and real-time updates. Perfect for modern content management.</p>',
        orderPosition: 3,
      },
    ]

    for (const article of sampleArticles) {
      await prisma.article.create({
        data: article,
      })
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