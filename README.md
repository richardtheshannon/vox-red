# Next.js CMS Template

A modern, reusable CMS template built with Next.js featuring a beautiful slider-based public interface and comprehensive admin dashboard. Perfect for portfolios, blogs, marketing sites, and content-driven applications.

## ✨ Features

### 🎨 **Public Interface**
- **Vertical Slider Design**: Full-screen Swiper.js slider with smooth transitions
- **Mobile-First**: Responsive design optimized for all devices
- **Real-time Updates**: Content updates instantly via Server-Sent Events
- **Rich Content**: Support for formatted text, images, and links
- **Keyboard/Touch Navigation**: Intuitive controls for all interaction types

### 👨‍💼 **Admin Dashboard**
- **Secure Authentication**: NextAuth.js with credential-based login
- **Rich Text Editor**: Tiptap editor with formatting, links, and images
- **Drag & Drop Ordering**: Reorder articles with visual feedback
- **CRUD Operations**: Create, read, update, and delete articles
- **Real-time Preview**: See changes instantly on the public site
- **Responsive Admin UI**: Works perfectly on mobile and desktop

### ⚡ **Technical Highlights**
- **Next.js 15**: Latest App Router with TypeScript
- **PostgreSQL + Prisma**: Type-safe database operations
- **Server-Sent Events**: Real-time content synchronization
- **Error Boundaries**: Comprehensive error handling
- **Loading States**: Smooth user experience with skeleton loaders
- **Deployment Ready**: Docker and Railway configuration included

## 🛠 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 15, React 19, TypeScript | Modern React framework |
| **Styling** | Tailwind CSS | Mobile-first responsive design |
| **Database** | PostgreSQL + Prisma ORM | Type-safe database operations |
| **Authentication** | NextAuth.js v5 | Secure credential-based auth |
| **Rich Editor** | Tiptap | Modern WYSIWYG editor |
| **Slider** | Swiper.js | Touch-friendly content presentation |
| **Real-time** | Server-Sent Events | Live content updates |
| **Deployment** | Docker + Railway | Production-ready deployment |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd nextjs-cms-template
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   NEXTAUTH_SECRET="your-super-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="your-secure-password"
   ```

4. **Set up the database**
   ```bash
   # Push schema to database
   npm run db:push
   
   # Generate Prisma client
   npx prisma generate
   
   # Seed with sample data
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Public site: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin/login
   - Database viewer: `npm run db:studio`

## 📱 Usage

### Admin Interface
1. Navigate to `/admin/login`
2. Sign in with your admin credentials
3. Use the dashboard to manage articles:
   - **Create**: Add new articles with rich content
   - **Edit**: Modify existing articles
   - **Reorder**: Drag and drop to change article sequence
   - **Delete**: Remove articles (with confirmation)

### Public Interface
- Articles display in a beautiful vertical slider
- Navigate with arrow keys, mouse wheel, or touch gestures
- Content updates automatically when admin makes changes
- Mobile-optimized with smooth animations

## 🏗 Project Structure

```
nextjs-cms-template/
├── app/
│   ├── admin/              # Admin dashboard pages
│   ├── api/                # API routes (CRUD + auth)
│   ├── components/         # Reusable components
│   │   ├── admin/          # Admin-specific components
│   │   ├── swiper/         # Public slider components
│   │   └── ui/             # UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and configurations
│   └── globals.css         # Global styles
├── prisma/                 # Database schema and migrations
├── types/                  # TypeScript type definitions
├── Dockerfile             # Container configuration
├── railway.json           # Railway deployment config
└── README.md
```

## 🌐 Deployment

### Railway (Recommended)

1. **Prepare your repository**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Railway**
   - Connect your GitHub repository to Railway
   - Add a PostgreSQL database service
   - Set environment variables in Railway dashboard:
     - `DATABASE_URL` (auto-provided by Railway)
     - `NEXTAUTH_SECRET` (generate a secure random string)
     - `NEXTAUTH_URL` (your Railway app URL)
     - `ADMIN_EMAIL` and `ADMIN_PASSWORD`

3. **Post-deployment setup**
   ```bash
   # Run database migrations
   npx prisma db push
   
   # Seed with initial data
   npm run db:seed
   ```

### Docker Deployment

```bash
# Build the image
docker build -t nextjs-cms .

# Run the container
docker run -p 3000:3000 --env-file .env.local nextjs-cms
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

### Database Management

```bash
# View database in browser
npm run db:studio

# Reset database (⚠️ Deletes all data)
npx prisma db push --force-reset

# Generate Prisma client after schema changes
npx prisma generate
```

## 🎯 Customization

### Adding New Fields
1. Update `prisma/schema.prisma`
2. Run `npm run db:push`
3. Update TypeScript types in `app/lib/validations.ts`
4. Modify admin forms and API endpoints

### Styling
- Global styles: `app/globals.css`
- Component styles: Use Tailwind CSS classes
- Custom animations: Defined in globals.css

### Content Types
The template uses a flexible article structure:
- **Title**: Main heading
- **Subtitle**: Optional subheading
- **Content**: Rich HTML content
- **Order**: Drag-and-drop positioning

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📄 License

MIT License - Feel free to use this template for personal or commercial projects.

## 🆘 Support

- Check the [Issues](https://github.com/your-repo/issues) for common problems
- Review the [Next.js Documentation](https://nextjs.org/docs)
- Consult the [Prisma Documentation](https://www.prisma.io/docs)

---

**Built with ❤️ using Next.js, Prisma, and modern web technologies.**
