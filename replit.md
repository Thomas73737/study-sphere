# StudyFlow AI - Study & Task Management Platform

## Overview
AI-powered study and task management platform for students. Built with React frontend + Express backend + PostgreSQL. Owned by Thomas Abdelmalak.

## Architecture
- **Frontend**: React + Wouter (routing) + TanStack Query + Shadcn UI + Tailwind CSS
- **Backend**: Express.js RESTful API
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Replit Auth (OpenID Connect)
- **AI**: OpenAI via Replit AI Integrations (gpt-5-mini for recommendations)
- **File Uploads**: Multer → local disk (uploads/ directory)

## Key Features
- User authentication (Replit Auth with roles: student/admin)
- Task & assignment management (CRUD with priority, status, due dates)
- Pomodoro timer (customizable focus/break durations)
- AI-powered study recommendations
- File uploads (notes, PDFs)
- Notifications system
- Admin dashboard (user management, analytics)
- Dark/light mode toggle

## Project Structure
- `client/src/pages/` - Page components (landing, dashboard, tasks, pomodoro, ai-study, files, notifications, admin)
- `client/src/components/` - Shared components (app-sidebar, theme-toggle, ui/)
- `server/routes.ts` - All API endpoints
- `server/storage.ts` - Database operations (DatabaseStorage implements IStorage)
- `server/db.ts` - Drizzle ORM connection
- `shared/schema.ts` - All Drizzle schemas + types
- `shared/models/auth.ts` - Auth-specific schemas (users, sessions)

## API Routes
All routes require authentication (`isAuthenticated` middleware) except auth endpoints:
- `GET/POST /api/tasks` - Task CRUD
- `PATCH/DELETE /api/tasks/:id`
- `GET/POST /api/pomodoro` - Pomodoro sessions
- `GET /api/recommendations` - AI study recommendations
- `POST /api/recommendations/generate` - Generate new AI recommendations
- `PATCH /api/recommendations/:id/dismiss`
- `GET /api/files` - File management
- `POST /api/files/upload` - Upload files (multipart)
- `GET /api/files/:id/download`
- `DELETE /api/files/:id`
- `GET /api/notifications` - Notifications
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `GET /api/admin/stats` - Admin analytics (admin only)
- `GET /api/admin/users` - User management (admin only)
- `PATCH /api/admin/users/:userId/role` - Update user role (admin only)
- `GET /api/profile` - User profile with role

## Database Tables
users, sessions, user_profiles, tasks, pomodoro_sessions, study_recommendations, file_uploads, notifications, conversations, messages

## Running
`npm run dev` starts Express + Vite on port 5000
