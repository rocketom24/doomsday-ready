# Interview notes

Plain-language notes for explaining this project. Everything here describes the code as it is in the repo.

## A. Architecture

- **One Next.js app** holds both the React UI and the API. API routes live in `src/app/api/**/route.ts`; each exports functions named after HTTP methods (`GET`, `POST`, `PATCH`).
- **The UI is one client component tree** (`DoomsdayApp`). It loads `/api/movies` and `/api/cinemas` with `fetch` through a small wrapper in `src/lib/client.ts` that turns the API's `{ error: { code, message } }` into a thrown error.
- **Prisma** is the layer between TypeScript and the database. `schema.prisma` describes the tables, migrations are SQL files generated from it, and the Prisma client gives typed queries.
- **SQLite** is a database in a single file (`prisma/dev.db`). No server to run. `DATABASE_URL` in `.env` points to it.
- **Zod** checks that request bodies have the right shape and values (for example runtime is an integer from 1 to 300) before any logic runs.

Request lifecycle, creating a movie:

1. User submits the movie form.
2. The frontend sends `POST /api/movies` with JSON.
3. The route parses the body with the Zod schema. Bad input throws and becomes a 400.
4. Inside a transaction, `assertValidPrerequisites` checks the prerequisite ids exist (404) and would not create a cycle (409).
5. Prisma inserts the movie and links the prerequisites in SQLite.
6. The API returns the movie as JSON with status 201.
7. The UI refetches the movie list, so the screen shows what is actually in the database.

## B. Rewatch algorithm

- **Graph**: a set of things (nodes) connected by arrows (edges). Here a node is a movie and an edge means "requires". Iron Man has no arrows out; The Avengers has arrows to Iron Man and Captain America: The First Avenger.
- **DFS (depth-first search)**: follow one path as deep as possible before trying the next. Good here because to plan a movie, you must first fully plan each of its prerequisites.
- **Recursion**: a function calling itself on a smaller piece of the problem. `visit(movie)` calls `visit(prerequisite)`. It stops at movies with no prerequisites.
- **Visited (`done`) set**: remembers which movies are already in the plan, so a movie reached by two paths is added once.
- **Prerequisite first**: a movie is pushed to the output list only after the loop over its prerequisites finishes, so everything it needs is already in the list.
- **Target excluded**: the target finishes last, so it is the last item, and the code pops it off.
- **Progress**: filter the plan for `watched === false`. `watchedCount = total - unwatched`. `remainingRuntime` = sum of the unwatched runtimes.
- **Cycle detection**: before saving prerequisite P for movie M, walk from P along its prerequisites. If M is reachable, saving would close a loop, so the API answers 409. A cycle is impossible to order: A needs B, B needs A, nobody can be first. `buildRewatchPlan` also has an `inProgress` set as a safety net so bad data cannot cause infinite recursion.

Small traversal, planning The Avengers: visit(Avengers) → visit(Iron Man): no prerequisites, add Iron Man → visit(Captain America: First Avenger): add it → all done, add The Avengers → pop it. Result: Iron Man, Captain America: First Avenger.

**Complexity**: `V` movies, `E` links. Plan is O(V + E) time, O(V) space. Cycle check is O(V + E) per proposed prerequisite.

**Likely questions**

1. *Why DFS and not BFS?* The order needed is "dependencies before dependents". DFS gives that directly by adding a node after its children. BFS would give distance levels and would need more work to produce a valid order.
2. *Is this a topological sort?* It is the DFS form of one, restricted to what the target needs (not the whole graph). Post-order of DFS gives a valid prerequisite-first order.
3. *What if two prerequisites share a prerequisite?* The visited set means it is added only the first time. It is still before both of its dependents.
4. *How do you stop cycles?* On write, `dependsOn` checks whether the new prerequisite already leads back to the movie. On read, the `inProgress` set throws instead of looping forever.
5. *Is the order unique?* No. Any order that puts prerequisites first is valid. The result depends on the order the prerequisites are listed in (the API sorts them by release year, then title).
6. *Could recursion overflow the stack?* Only for a prerequisite chain thousands of movies long. For this domain, chains are short.
7. *Why does the check happen in a transaction?* Otherwise another request could change the graph between the check and the write.

## C. Booking algorithm

- **Greedy is unreliable**: "take the biggest bundle that fits" can dead-end or be wasteful. Bundles 2 and 5, group 11: 5+5 leaves 1, which cannot be filled, but 5+2+2+2 works. Bundles 1, 3, 4, group 6: greedy gives 4+1+1 (3 bundles), best is 3+3 (2).
- **Dynamic programming here**: solve small versions of the problem (0 seats, 1 seat, 2 seats, ...) and use those answers for bigger ones.
- **`fewest[n]`** = fewest bundles to make exactly `n` seats, or `Infinity` if impossible. `fewest[0] = 0`.
- **Building up**: for each `n`, try each bundle size `s`. If `n - s` is reachable, `fewest[n - s] + 1` is a candidate. Keep the smallest.
- **Predecessor**: `lastBundle[n]` stores which size gave the best result for `n`.
- **Reconstruction**: from `n = groupSize`, add `lastBundle[n]` to the answer, move to `n - lastBundle[n]`, repeat until 0. For 11 with [2, 5]: 2, 2, 2, 5.
- **Impossible**: `fewest[groupSize]` is still `Infinity`, so the function returns `null` and the API returns `possible: false` with status 200.

**Complexity**: `G` = group size, `B` = number of bundle sizes. Time O(G × B), space O(G).

**Likely questions**

1. *Why not greedy?* It commits to the biggest bundle without checking that the rest can be filled; the 2/5 and 1/3/4 examples break it.
2. *What does `fewest[n]` mean?* Minimum bundles for exactly n seats.
3. *Why does it work?* The best way to make n seats ends with some bundle s, and what remains is a best way to make n - s seats. Trying all s and picking the smallest covers every case.
4. *How do you know which bundles were used?* `lastBundle[n]` records the choice at each step; walking back from the group size gives the list.
5. *How do you know it is correct?* The tests compare it against an independent brute-force search for every group size up to 150, plus the greedy-failure and impossible cases.
6. *Can bundles be reused?* Yes, `fewest[n - s]` may itself use size `s`.
7. *What if there are ties?* Any minimal combination is valid; the code keeps the first one found (smaller bundle sizes are tried first, and only a strictly better result replaces it).

## D. API and backend

- **REST**: URLs name things (`/api/movies/3`), HTTP methods name the action. **GET** reads, **POST** creates (201), **PATCH** changes some fields of an existing item.
- **Status codes**: 200 OK, 201 Created, 400 bad input, 404 not found, 409 conflict with existing state, 500 server error.
- **Validation**: Zod schemas in `src/lib/validations/`. A Zod error becomes 400 `VALIDATION_ERROR`.
- **Unique constraints**: `Movie.title` and `Cinema.name` are `@unique`. A duplicate makes Prisma throw error `P2002`, which `handleError` turns into 409 `DUPLICATE_TITLE` / `DUPLICATE_CINEMA`. The database enforces it, so two simultaneous requests cannot both succeed.
- **Transactions**: `prisma.$transaction` runs the check and the write as one unit. If a prerequisite is invalid the whole update is abandoned.
- **Error handling**: routes throw `ApiError` (or let Zod / Prisma errors escape) and one `handleError` function builds every error response in the same shape. Unexpected errors return a generic 500 so internals do not leak.
- **Why cycles return 409**: the request is well-formed (not 400) and the thing exists (not 404), but it conflicts with the current state of the data.
- **Integrity**: unique titles, validated fields, the prerequisite join table has a unique pair (no duplicate links) and cascades on delete, and cycle checks run inside a transaction.
- **Why impossible booking is 200**: it is a valid question with a valid answer ("no combination").

## E. Frontend

- **Components**: `DoomsdayApp` owns the data and the active tab; `MovieDatabase`, `RewatchProtocol` and `CinemaBooking` render the three views; `ui/` has shared pieces (modal, toasts, select, loading and error blocks).
- **State**: `useState` for movies, cinemas, the active tab, pending ids and toasts. `useEffect` does the initial fetch (with a cancel flag so an old response cannot overwrite a newer state).
- **Loading / error / success**: loading block while fetching, error block with a retry button if loading fails, toasts for save results, inline messages in the forms and the booking view.
- **Optimistic update**: toggling watched flips the movie in local state immediately, sends `PATCH { watched }`, and flips it back with an error toast if the request fails.
- **No overwriting of unrelated fields**: the toggle sends only `{ watched }`, and the PATCH route only updates fields that were sent, leaving prerequisites untouched unless they are included.
- **Rewatch view**: fetches `/api/movies/:id/rewatch-order` for the chosen movie and refetches when movie data changes.
- **Booking view**: sends `groupSize` to the booking endpoint and shows either the breakdown or the "not possible" message. It ignores out-of-date responses if the user submits twice quickly.

## F. Testing

- **Algorithm tests** are fast and catch logic bugs (off-by-one, wrong order, missing impossible case) without a database.
- **API tests** check status codes, validation, duplicates, 409/404 behavior and that a rejected cycle really does not change the data.
- **Separate database**: the API tests create a temporary SQLite file from the real migrations and delete it afterwards, so tests cannot damage `dev.db`, and `dev.db` content cannot make tests flaky.
- **Brute-force cross-check**: for every group size up to 150, the DP result is compared with a slow, obviously correct exhaustive search. It checks the DP gives the true minimum and the right feasibility.
- **What manual UI testing cannot prove**: it was done by hand once; it does not protect against future regressions. There are no automated UI tests.
- **Limitations**: Docker files were not built on the dev machine; the cycle check is not tested under truly concurrent requests; no delete endpoint or auth exists (not in scope).

## G. AI disclosure

The README states that Claude Code helped with planning, API routes, the frontend, tests and documentation, and that it was also involved in writing both algorithms. No graph or optimization library is used. Do not say you wrote the algorithms alone if that is not what happened.

A truthful answer to "Did you use AI to build this?":

> "Yes. I used Claude Code throughout, including for the two algorithms, and it's disclosed in the README. No algorithm libraries are used, it's plain TypeScript. I reviewed and ran the code, and I can walk you through both algorithms: how the DFS orders prerequisites and detects cycles, and how the DP table finds the fewest bundles. The booking one I also checked against a brute-force search in the tests."

Only say that last part about reviewing and explaining if it is true for you. Practise the explanations in sections B and C until you can do them without the notes, because that is what an interviewer will test.
