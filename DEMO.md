# Demo walkthrough (3-5 minutes)

Start from a fresh seed (`npm run db:seed`, then `npm run dev`) or `docker compose up --build`. Everything below uses the seeded data. Ticking "watched" can be undone by unticking it. The circular dependency step saves nothing because it is rejected. The app has no delete feature, so adding a movie is permanent; skip that step on data you want to keep clean.

## 1. Movie database (about 1 min)

- Open http://localhost:3000. "This app does two things: it plans a rewatch before Avengers: Doomsday, and it works out cinema bundles for a group."
- Point at the seeded movies, ordered by release year, each with its prerequisites.
- Tick **Iron Man** as watched. "That is an optimistic update: the UI flips immediately, sends a PATCH with only the watched field, and rolls back if the request fails."
- Type "avengers" in the search box, then try the Watched / Unwatched filters.
- Optional: click **Add movie**. Submitting an empty title or a runtime of 0 shows validation. Creating a real entry is permanent (no delete), so only do it on a throwaway database.

## 2. Dependency validation (about 1 min)

- Open **Iron Man** for editing and set its prerequisite to **Avengers: Doomsday**, then save.
- It is rejected with the 409 `CIRCULAR_DEPENDENCY` message. "Doomsday already requires Iron Man through Endgame, Infinity War, Civil War and The Avengers. Making Iron Man require Doomsday would make a loop where nothing can be watched first."
- "The check and the write happen in one transaction, so the rejected request changed nothing." Close the form.

## 3. Rewatch protocol (about 1 min)

- Go to **Rewatch protocol** and select **Avengers: Doomsday**.
- Read the order: Iron Man, Captain America: The First Avenger, The Avengers, Civil War, Thor: Ragnarok, Infinity War, Endgame.
- "Each prerequisite appears once even where chains join, for example The Avengers is needed through two paths. Doomsday is not in its own list because this is what you watch before it."
- Show the watched progress (Iron Man is ticked, so 1 of 7) and the remaining runtime (1000 minutes with nothing watched, 874 with Iron Man watched).
- Mention that Doomsday's runtime is placeholder data, but it does not affect the plan because the target is excluded.

## 4. Cinema booking (about 1 min)

- Go to **Cinema booking**, choose **Star Cineplex Jamuna Future Park** (bundles of 2 and 5), enter **11**.
- Result: 4 bundles, one of 5 and three of 2. "Greedy would take 5 + 5 and get stuck with 1 seat left. The dynamic programming table works out the best answer for every size up to 11, so it finds 5 + 2 + 2 + 2."
- Enter **1**: no exact combination. "That is a normal answer, not an error, so the API returns 200 with possible false."
- Optional: choose **Bashundhara City Complex** (1, 3, 4) with **6**: result is 3 + 3, two bundles, where greedy would use three.

## 5. Close (about 30 seconds)

"So: movies with prerequisites and validation, a graph traversal that builds the rewatch order and blocks cycles, a dynamic programming solution for the minimum number of bundles, all in one Next.js app with Prisma and SQLite. Tests cover both algorithms and the API. I used AI tools while building it, and that is disclosed in the README."
