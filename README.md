# University Club Management System

A full-stack university club platform for discovering clubs and events, managing memberships,
publishing announcements, collecting payments, sharing files, and handling feedback and safety
reports. The project is being modernized into a portfolio-ready application with a consistent
CampusHub design system.

## Current status

The main UI modernization and backend hardening pass is complete. Both applications compile
successfully. End-to-end runtime verification requires MongoDB and environment configuration,
which are not included in this repository.

## Live demo

Open the deployed application:

**[Launch CampusHub](https://university-club-management-system.vercel.app/login)**

| Screen | Link | What to explore |
|---|---|---|
| Sign in | [/login](https://university-club-management-system.vercel.app/login) | Member authentication and session handling |
| Create account | [/register](https://university-club-management-system.vercel.app/register) | Validated account registration |
| Browse clubs | [/browse-clubs](https://university-club-management-system.vercel.app/browse-clubs) | Public club discovery |
| Browse events | [/browse-events](https://university-club-management-system.vercel.app/browse-events) | Event discovery and registration |
| Admin portal | [/admin](https://university-club-management-system.vercel.app/admin) | Moderation and administration tools |

> The production URL is recommended for testing. Vercel preview URLs may require Vercel
> authentication depending on the project’s deployment protection settings.

## Demo accounts

These accounts are created by the idempotent demo seed command described below:

| Role | Email | Password | Suggested tour |
|---|---|---|---|
| Administrator | `demo.admin@campushub.test` | `CampusHubDemo2026!` | Admin dashboard, approvals, reports and feedback moderation |
| Student | `alex.morgan@campushub.test` | `CampusHubDemo2026!` | Dashboard, clubs, events, payments and notifications |
| Club organizer | `jordan.lee@campushub.test` | `CampusHubDemo2026!` | Club management, events and announcements |
| Member | `samira.khan@campushub.test` | `CampusHubDemo2026!` | Joined clubs, event feedback and the media experience |

These are intentionally non-production demo credentials. Change or remove them before using a
database for real users.

## Seed the deployed demo database

The repository includes an idempotent seed script that adds representative data without clearing
existing collections. It creates demo users, approved and pending club activity, upcoming and past
events, announcements, payments, notifications, feedback and moderation reports.

Run this from the deployed Render service shell, where the private `MONGODB_URI` is already
configured:

```bash
npm run seed:demo
```

The command is safe to run again. It updates the same demo records instead of creating duplicates.
It does not delete existing users or application data.

### Seeded demo content

- 4 clubs: robotics, debate, creative arts and sustainability
- 5 events, including upcoming and completed examples
- 4 announcements
- Pending and approved payment records
- Read and unread notifications
- Approved and pending feedback
- A pending moderation report

## Product preview

### Member workspace

```text
CampusHub
├── Dashboard       Overview, upcoming events and announcements
├── Clubs           Discover, join and manage campus communities
├── Events          Browse, register and track attendance
├── Payments        Submit and review event payments
├── Notifications   Keep up with club and event activity
└── Profile         Manage identity, preferences and theme
```

### Administration workspace

```text
Admin workspace
├── Overview        Platform activity and operational metrics
├── Users           Search, review and manage accounts
├── Clubs           Approve clubs and review membership activity
├── Payments        Review payment submissions
├── Feedback        Moderate ratings and respond to members
└── Reports         Review safety reports and take action
```

The interface uses a responsive application shell, indigo action accents, neutral surfaces,
accessible form controls, empty states, loading skeletons and light/dark themes.

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
