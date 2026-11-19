# University Club Management System

A full-stack university club platform for discovering clubs and events, managing memberships,
publishing announcements, collecting payments, sharing files, and handling feedback and safety
reports. The project is being modernized into a portfolio-ready application with a consistent
CampusHub design system.

## Current status

The main UI modernization and backend hardening pass is complete. Both applications compile
successfully. End-to-end runtime verification requires MongoDB and environment configuration,
which are not included in this repository.

## Features

- JWT authentication with member and admin experiences
- Club creation, approval, membership applications and member management
- Event creation, registration, payments and event management
- Announcements and notifications
- Feedback and rating workflows with moderation
- Content reports with attachments and admin review
- File uploads, gallery browsing and downloads
- Responsive light/dark interface with shared app shell
- Admin dashboards for users, clubs, payments, announcements, feedback and reports

## Stack

### Frontend

- React 19 with Create React App
- React Router
- Tailwind CSS and Heroicons
- Material UI remains for legacy file/feedback widgets
- Axios with a shared authenticated API client

### Backend

- NestJS 11 and TypeScript
- MongoDB with Mongoose
- JWT authentication and Socket.IO notifications
- Class-validator DTO validation
- Multer-based file uploads

## Project structure

```text
backend/   NestJS API
frontend/  React client
docs/      Audit, modernization plan and upgrade notes
```

## Setup

Install dependencies in both applications:

```bash
cd backend && npm install
cd ../frontend && npm install
```

Create environment files from the examples:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Set valid local values for MongoDB, JWT and any upload provider before starting the services.
Never commit `.env` files or real credentials.

Run the applications in separate terminals:

```bash
cd backend && npm run start:dev
cd frontend && npm start
```

The frontend defaults to `http://localhost:3000` and the API defaults to `http://localhost:8000`.
Set `REACT_APP_API_URL` if the API is hosted elsewhere.

## Verification commands

```bash
cd frontend && npm run build
cd backend && npm run build
```

Both commands currently pass. Browser smoke testing and integration tests should be run with a
seeded MongoDB instance before deployment.

## Security note

Cloudinary credentials were previously present in repository history. They must be rotated at the
provider before any deployment, even though the example file now contains placeholders.

## Documentation

- [UI audit and modernization plan](docs/UI_AUDIT_AND_PLAN.md)
- [UI upgrade notes](docs/UI_UPGRADE_NOTES.md)
