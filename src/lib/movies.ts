import { Prisma } from "@prisma/client";
import { ApiError } from "./api";
import { dependsOn } from "./algorithms/rewatch-order";

const movieSummary = { id: true, title: true, releaseYear: true, runtime: true, watched: true } as const;
const bySummaryOrder = [{ releaseYear: "asc" }, { title: "asc" }] as const;

// Shared by create/list/update so every endpoint returns the same shape.
export const movieInclude = {
  prerequisites: { select: movieSummary, orderBy: [...bySummaryOrder] },
  dependents: { select: movieSummary, orderBy: [...bySummaryOrder] },
} satisfies Prisma.MovieInclude;

// Rejects missing prerequisite ids (404) and anything that would create a cycle (409).
// movieId is undefined when the movie is being created (nothing can depend on it yet).
export async function assertValidPrerequisites(
  tx: Prisma.TransactionClient,
  movieId: number | undefined,
  prerequisiteIds: number[],
) {
  if (prerequisiteIds.length === 0) return;

  if (movieId !== undefined && prerequisiteIds.includes(movieId)) {
    throw new ApiError(409, "CIRCULAR_DEPENDENCY", "A movie cannot be its own prerequisite.");
  }

  const rows = await tx.movie.findMany({
    select: { id: true, prerequisites: { select: { id: true } } },
  });
  const existing = new Set(rows.map((r) => r.id));
  const missing = prerequisiteIds.filter((id) => !existing.has(id));
  if (missing.length > 0) {
    throw new ApiError(404, "NOT_FOUND", `Prerequisite movie(s) not found: ${missing.join(", ")}.`);
  }

  if (movieId === undefined) return;
  const graph = rows.map((r) => ({ id: r.id, prerequisiteIds: r.prerequisites.map((p) => p.id) }));
  const culprit = prerequisiteIds.find((id) => dependsOn(graph, id, movieId));
  if (culprit !== undefined) {
    throw new ApiError(
      409,
      "CIRCULAR_DEPENDENCY",
      `Movie ${culprit} already requires movie ${movieId}, so it cannot be its prerequisite.`,
    );
  }
}
