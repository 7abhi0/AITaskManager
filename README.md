# AI Task Manager (MERN + TS)

A production-ready, full-stack **MERN** application built with **TypeScript**, **Tailwind CSS**, and **Zustand**, offering advanced AI capabilities using OpenAI, real-time collaboration with Socket.IO, background queue processing with BullMQ + Redis, and robust validation via Zod.

## Features

- **Authentication & RBAC**: JWT authorization with persistent logins and Role-Based Access Control (Admin, Team Lead, Member).
- **Kanban Board**: Drag-and-drop board using `@dnd-kit` with instant database updates and Socket.IO live-sync.
- **Smart AI Service (OpenAI)**:
  - Auto task categorization.
  - Priority predictions.
  - Deadline recommendations.
  - Task decomposition into subtasks checklists.
  - Daily progress summaries & workload load balancing tips.
- **Discussion Threads**: Real-time comments with user avatars.
- **Audit Trails**: Complete visual activity logs tracking task edits.
- **Task Attachments**: Dual storage backend uploading files to Cloudinary or falling back to local storage directories.
- **Security Primitives**: Request rate limiters, Helmet, CORS configs, Zod schema validation, and Pino logging.

---

## Technical Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Zustand, Recharts, dnd-kit, Socket.IO client, Lucide React.
- **Backend**: Node.js, Express.js, TypeScript, MongoDB (Mongoose), Socket.IO, BullMQ + Redis, Pino logging.
- **APIs & Storage**: OpenAI API, Cloudinary (file attachments), Swagger UI (docs).

---

## Folder Structure

```text
/client            - Vite React SPA with Tailwind and Zustand
/server            - Express API server with Mongoose schemas
/shared            - Shared Typescript models
docker-compose.yml - Docker orchestrator
.env.example       - Template config key maps
README.md          - Documentation and running guide
```

---

## Setup & Running Guide

### Prerequisite Configurations
1. Duplicate `.env.example` in the root and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Adjust environment variables inside `.env` if using a custom MongoDB URI or Redis connection string.

### Method 1: Local Development

#### 1. Setup Backend
```bash
cd server
npm install
# Seed the database (creates 3 sample users and tasks)
npm run seed
# Start backend server in development mode
npm run dev
```
*API runs at `http://localhost:5000`. Swagger documentation is available at `http://localhost:5000/api/v1/docs`.*

#### 2. Setup Frontend
```bash
cd ../client
npm install
# Start client dev server
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

---

### Method 2: Running with Docker-Compose

To spin up the entire stack (MongoDB, Redis, Express backend, and React Nginx frontend) with one command:
```bash
docker-compose up --build
```
- Client portal: `http://localhost` (Port 80)
- Backend server: `http://localhost:5000`

---

## Database Seeder Accounts

You can log in instantly with the seeded test accounts:

| User Role | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@taskmanager.com` | `password123` |
| **Team Lead** | `lead@taskmanager.com` | `password123` |
| **Member (Alex Developer)** | `member@taskmanager.com` | `password123` |
