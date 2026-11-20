# Doomsday Ready

Doomsday Ready helps MCU fans get ready for Avengers: Doomsday. The idea is to manage movies and their prerequisite movies, build a rewatch plan from those dependencies, and work out exact seat bundle combinations at cinemas for a watch party. Built as an assessment project for the Blinto Talent Accelerator 2027 Full Stack Developer Internship.

## Tech stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS
- Prisma 6 with SQLite
- Zod

## Features

- Movies: create, list, edit (title, year, runtime, prerequisites), watched toggle, search and All/Watched/Unwatched filters.
- Rewatch protocol: pick a movie and get every transitive prerequisite once, in a valid watch order, with progress and remaining runtime.
- Cinema booking: cinemas sell seats in fixed bundle sizes; the app finds the fewest bundles that fill a group exactly (or says it is impossible).
- Local poster artwork in `public/posters` with a plain title-card fallback.

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
| `npm test` | Algorithm unit tests (Node's built-in test runner via tsx) |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Run migrations (`prisma migrate dev`) |
| `npm run db:seed` | Seed movies and cinemas |

## API

All errors use `{ "error": { "code": "...", "message": "..." } }`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/movies` | List movies (by year, then title) with `prerequisites` and `dependents` |
| POST | `/api/movies` | Create a movie |
| PATCH | `/api/movies/:id` | Update title / releaseYear / runtime / watched / prerequisites (all optional, at least one) |
| GET | `/api/movies/:id/rewatch-order` | Prerequisite rewatch plan |
| GET | `/api/cinemas` | List cinemas (`bundleSizes` as an array) |
| POST | `/api/cinemas` | Create a cinema |
| GET | `/api/cinemas/:id/booking?groupSize=N` | Minimum-bundle booking quote |

```bash
curl -X POST localhost:3000/api/movies -H "content-type: application/json"   -d '{"title":"Doctor Strange","releaseYear":2016,"runtime":115,"prerequisites":[1]}'
curl -X PATCH localhost:3000/api/movies/1 -H "content-type: application/json" -d '{"watched":true}'
curl localhost:3000/api/movies/8/rewatch-order
curl "localhost:3000/api/cinemas/2/booking?groupSize=11"
```

Rewatch order response (`remainingRuntime` counts only unwatched prerequisites; the target is never included):

```json
{ "target": { "id": 8, "title": "Avengers: Doomsday" },
  "movies": [{ "id": 1, "title": "Iron Man", "releaseYear": 2008, "runtime": 126, "watched": false }],
  "totalMovies": 7, "watchedCount": 0, "unwatchedCount": 7, "remainingRuntime": 1000 }
```

Booking quote (`GET /api/cinemas/2/booking?groupSize=11`). An impossible size still returns 200 with `"possible": false`, `totalBundles`/`totalSeats` `null` and `bundles: []`:

```json
{ "cinema": { "id": 2, "name": "Star Cineplex Jamuna Future Park", "bundleSizes": [2, 5] },
  "groupSize": 11, "possible": true, "totalBundles": 4, "totalSeats": 11,
  "bundles": [{ "size": 5, "count": 1 }, { "size": 2, "count": 3 }] }
```

### How it works

- **Rewatch order** ([rewatch-order.ts](src/lib/algorithms/rewatch-order.ts)): depth-first search from the target. A movie is appended only after all its prerequisites, so prerequisites always come first; a visited set keeps each movie once when paths converge. The target is dropped from the end. A loop in stored data (should be impossible) throws `CIRCULAR_DEPENDENCY`.
- **Cycle detection**: before saving prerequisites for movie M, each proposed prerequisite P is checked with a visited-set traversal: does P already (transitively) require M? If so, or if P is M, the request is rejected with 409. The check and the write run in one Prisma transaction, so a rejected update changes nothing.
- **Booking** ([booking.ts](src/lib/algorithms/booking.ts)): dynamic programming. `fewest[n]` is the fewest bundles making exactly n seats, `fewest[n] = 1 + min(fewest[n - size])`. The bundle chosen at each n is remembered and walked back from the group size to rebuild the counts. Unreachable sizes mean "impossible". O(groupSize x bundleCount).

### Error codes

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | bad JSON, bad id, bad fields, duplicate prerequisite ids, empty PATCH, bad `groupSize` |
| 404 | `NOT_FOUND` | movie/cinema not found, prerequisite id does not exist |
| 409 | `DUPLICATE_TITLE` / `DUPLICATE_CINEMA` | unique name already taken |
| 409 | `CIRCULAR_DEPENDENCY` | self or indirect prerequisite cycle |
| 500 | `INTERNAL_SERVER_ERROR` | unexpected error, or a cinema with corrupted bundle data (booking only) |

### Decisions

- A self-dependency returns `CIRCULAR_DEPENDENCY` as well, since it is the smallest cycle.
- `GET /api/cinemas` skips (and logs) a cinema whose stored `bundleSizes` JSON is malformed instead of failing the whole list.
- Cinema bundle sizes are saved in ascending order. Booking results are listed largest bundle first. When several combinations tie, any one minimal combination is returned.
- No `BOOKING_NOT_POSSIBLE` error is used: an impossible quote is a valid answer, so it is a 200.

### Testing

```bash
npm test        # 54 automated tests: tests/algorithms.test.ts (31) + tests/api.test.ts (23)
npm run lint
npm run build
```

- `algorithms.test.ts`: booking DP (cross-checked against an independent brute force for every group size up to 150, greedy-failure cases, impossible sizes, 1 and 10000, bundle sizes near 500) and rewatch order / cycle detection (chains, diamonds, shared dependencies, watched counting, runtime, corrupted cycles).
- `api.test.ts`: calls the real route handlers for movies, rewatch order, cinemas and booking (validation, duplicates, 404s, 409 cycles, rejected cycle leaves data unchanged). It creates a throwaway SQLite file in the OS temp dir from the migrations and deletes it afterwards; `prisma/dev.db` is never touched.
- The UI was checked manually in a browser (filters, forms, cycle error, optimistic rollback, rewatch plan, booking, 320-1280px widths). There are no automated browser tests.

## AI usage disclosure

I used Claude Code (Anthropic) throughout this project: project setup, API routes, algorithms, the frontend, the test suites and this README. I reviewed and ran the code and tests. The traversal, cycle detection and dynamic programming are hand-written with no graph or optimization libraries.
