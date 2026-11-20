# Doomsday Ready

Doomsday Ready helps MCU fans get ready for Avengers: Doomsday. The idea is to manage movies and their prerequisite movies, build a rewatch plan from those dependencies, and work out exact seat bundle combinations at cinemas for a watch party. Built as an assessment project for the Blinto Talent Accelerator 2027 Full Stack Developer Internship.

## Tech stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS
- Prisma 6 with SQLite
- Zod

## Status

Phase 1 (project setup and database) is complete: Prisma schema, initial migration, seed data and Zod validation schemas. Nothing else is built yet.

## Setup

```bash
npm install
cp .env.example .env
npm run db:migrate   # creates prisma/dev.db and applies migrations
npm run db:seed      # safe to re-run
npm run dev          # http://localhost:3000
```

`.env` only needs `DATABASE_URL` (see `.env.example`). The SQLite file lives at `prisma/dev.db` and is git-ignored.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Run migrations (`prisma migrate dev`) |
| `npm run db:seed` | Seed movies and cinemas |
