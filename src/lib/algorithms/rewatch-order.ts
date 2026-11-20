// A movie and the ids of the movies it requires (its direct prerequisites).
export type MovieNode = {
  id: number;
  title: string;
  releaseYear: number;
  runtime: number;
  watched: boolean;
  prerequisiteIds: number[];
};

export class CircularDependencyError extends Error {
  constructor(message = "These prerequisites would create a circular dependency.") {
    super(message);
  }
}

// True if `from` already requires `target`, directly or through a chain of prerequisites.
// Used before saving: if proposed prerequisite P already requires movie M, then
// making P a prerequisite of M would close a loop. from === target counts (self-dependency).
export function dependsOn(
  movies: { id: number; prerequisiteIds: number[] }[],
  from: number,
  target: number,
): boolean {
  const graph = new Map(movies.map((m) => [m.id, m.prerequisiteIds]));
  const visited = new Set<number>();
  const stack = [from];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === target) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    stack.push(...(graph.get(current) ?? []));
  }
  return false;
}

// Depth-first search: a movie is added to the result only after all of its
// prerequisites were added, so prerequisites always come first. The `done` set
// makes every movie appear once even when paths converge (diamond shapes).
export function buildRewatchPlan(movies: MovieNode[], targetId: number) {
  const byId = new Map(movies.map((m) => [m.id, m]));
  const done = new Set<number>();
  const inProgress = new Set<number>();
  const order: MovieNode[] = [];

  function visit(id: number) {
    if (done.has(id)) return;
    if (inProgress.has(id)) throw new CircularDependencyError();
    const movie = byId.get(id);
    if (!movie) return;

    inProgress.add(id);
    for (const prerequisiteId of movie.prerequisiteIds) visit(prerequisiteId);
    inProgress.delete(id);

    done.add(id);
    order.push(movie);
  }

  visit(targetId);
  order.pop(); // the target itself is always last; it is not part of its own plan

  const unwatched = order.filter((m) => !m.watched);
  return {
    movies: order.map(({ id, title, releaseYear, runtime, watched }) => ({
      id,
      title,
      releaseYear,
      runtime,
      watched,
    })),
    totalMovies: order.length,
    watchedCount: order.length - unwatched.length,
    unwatchedCount: unwatched.length,
    remainingRuntime: unwatched.reduce((sum, m) => sum + m.runtime, 0),
  };
}
