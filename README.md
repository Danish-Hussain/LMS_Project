# LMS - Learning Management System

A complete Learning Management System built with Next.js, TypeScript, and Tailwind CSS for providing online training with video recordings and batch management.

## Features

### 🎓 Core Features
- **User Authentication**: Role-based access (Admin, Instructor, Student)
- **Course Management**: Create, edit, and manage courses with video content
- **Video Player**: Custom video player with progress tracking
- **Batch Management**: Organize students into learning batches
- **Progress Tracking**: Monitor student progress and completion
- **Session Management**: Organize course content into sessions

### 👥 User Roles
- **Admin**: Full system access, user management, analytics
- **Instructor**: Course creation, student management, batch assignment
- **Student**: Course enrollment, video watching, progress tracking

### 🎥 Video Features
- Custom video player with controls
- Progress tracking and resume functionality
- Completion status tracking
- Watch time analytics

### 📊 Analytics & Reporting
- Student progress tracking
- Course completion rates
- Batch performance metrics
- Enrollment statistics

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT-based authentication
- **Video**: HTML5 Video with custom controls
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LMS_System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### First Time Setup

1. **Create an Admin Account**
   - Go to `/register`
   - Select "Instructor" role
   - Complete registration

2. **Create Your First Course**
   - Navigate to `/courses/new`
   - Add course details and thumbnail
   - Create sessions with video URLs

3. **Set Up Batches**
   - Go to `/batches/new`
   - Create batches for organizing students

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── courses/           # Course pages
│   ├── batches/           # Batch management
│   ├── students/          # Student management
│   └── dashboard/         # Dashboard pages
├── components/            # Reusable components
│   ├── Layout/           # Layout components
│   └── VideoPlayer.tsx   # Custom video player
├── contexts/             # React contexts
├── lib/                  # Utility functions
└── prisma/              # Database schema
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `GET /api/courses/[id]` - Get course details
- `PUT /api/courses/[id]` - Update course
- `DELETE /api/courses/[id]` - Delete course

### Batches
- `GET /api/batches` - List batches
- `POST /api/batches` - Create batch
- `GET /api/batches/[id]` - Get batch details

### Progress
- `GET /api/progress` - Get user progress
- `POST /api/progress` - Update progress

### Enrollments
- `GET /api/enrollments` - Get user enrollments
- `POST /api/enrollments` - Enroll in course

## Database Schema

The system uses the following main entities:

- **Users**: Authentication and user management
- **Courses**: Learning content with sessions
- **Sessions**: Individual video lessons
- **Batches**: Student groupings
- **Enrollments**: Course enrollment tracking
- **Progress**: Learning progress tracking

## Features by Role

### Admin/Instructor Features
- Create and manage courses
- Add video sessions to courses
- Create and manage batches
- View student progress
- Manage user accounts
- Access analytics dashboard

### Student Features
- Browse available courses
- Enroll in courses
- Watch video sessions
- Track learning progress
- View completion status

## Video Player Features

- **Custom Controls**: Play/pause, volume, fullscreen
- **Progress Tracking**: Automatic progress saving
- **Resume Functionality**: Continue from last position
- **Completion Detection**: Mark sessions as complete
- **Time Tracking**: Monitor watch time

## Deployment

### Environment Variables
Create a `.env.local` file with:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"
```

### Production Deployment
1. Set up a production database (PostgreSQL recommended)
2. Update environment variables
3. Run database migrations
4. Deploy to your preferred platform (Vercel, Netlify, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.