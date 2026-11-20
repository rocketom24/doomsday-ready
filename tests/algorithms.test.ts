import { test } from "node:test";
import assert from "node:assert/strict";
import { minBundles } from "../src/lib/algorithms/booking";
import {
  buildRewatchPlan,
  CircularDependencyError,
  dependsOn,
  type MovieNode,
} from "../src/lib/algorithms/rewatch-order";

// ---- booking -------------------------------------------------------------

function seats(result: ReturnType<typeof minBundles>) {
  return result!.reduce((sum, b) => sum + b.size * b.count, 0);
}
function total(result: ReturnType<typeof minBundles>) {
  return result!.reduce((sum, b) => sum + b.count, 0);
}

test("booking: [1,3,4] for 6 -> 3x2", () => {
  const r = minBundles([1, 3, 4], 6);
  assert.deepEqual(r, [{ size: 3, count: 2 }]);
});

test("booking: [2,5] for 11 -> 5x1 + 2x3 (4 bundles)", () => {
  const r = minBundles([2, 5], 11);
  assert.deepEqual(r, [
    { size: 5, count: 1 },
    { size: 2, count: 3 },
  ]);
  assert.equal(total(r), 4);
});

test("booking: [6,9,20] for 44 -> 20x1 + 9x2 + 6x1 (4 bundles)", () => {
  const r = minBundles([6, 9, 20], 44);
  assert.deepEqual(r, [
    { size: 20, count: 1 },
    { size: 9, count: 2 },
    { size: 6, count: 1 },
  ]);
});

test("booking: [4,6] for 7 is impossible", () => {
  assert.equal(minBundles([4, 6], 7), null);
});

test("booking: cases where largest-first greedy is wrong", () => {
  assert.equal(total(minBundles([1, 3, 4], 6)), 2); // greedy: 4+1+1 = 3 bundles
  assert.equal(total(minBundles([1, 15, 25], 30)), 2); // greedy: 25+5x1 = 6 bundles
});

test("booking: group size 1", () => {
  assert.deepEqual(minBundles([1, 5], 1), [{ size: 1, count: 1 }]);
  assert.equal(minBundles([2, 5], 1), null);
});

test("booking: group size 10000 is exact and fast", () => {
  const start = Date.now();
  const r = minBundles([7, 13, 500], 10000);
  assert.equal(seats(r), 10000);
  assert.equal(total(r), 20); // 20 x 500
  assert.ok(Date.now() - start < 1000);
});

test("booking: unsorted sizes give the same minimum", () => {
  assert.equal(total(minBundles([5, 2], 11)), total(minBundles([2, 5], 11)));
  assert.equal(seats(minBundles([20, 6, 9], 44)), 44);
});

test("booking: bundle bigger than group is ignored", () => {
  assert.deepEqual(minBundles([500, 2], 4), [{ size: 2, count: 2 }]);
});

// ---- rewatch order / cycle detection ------------------------------------

function movie(id: number, prerequisiteIds: number[], extra: Partial<MovieNode> = {}): MovieNode {
  return { id, title: `M${id}`, releaseYear: 2000 + id, runtime: 100, watched: false, prerequisiteIds, ...extra };
}

// 1 Iron Man, 2 Cap, 3 Avengers(1,2), 4 Civil War(3), 5 Ragnarok, 6 IW(4,5), 7 Endgame(6), 8 Doomsday(7)
const mcu = [
  movie(1, []),
  movie(2, []),
  movie(3, [1, 2]),
  movie(4, [3]),
  movie(5, []),
  movie(6, [4, 5]),
  movie(7, [6]),
  movie(8, [7]),
];

function assertPrerequisitesFirst(plan: { movies: { id: number }[] }, all: MovieNode[]) {
  const position = new Map(plan.movies.map((m, i) => [m.id, i]));
  for (const m of plan.movies) {
    for (const p of all.find((x) => x.id === m.id)!.prerequisiteIds) {
      assert.ok(position.get(p)! < position.get(m.id)!, `${p} must come before ${m.id}`);
    }
  }
}

test("rewatch: Doomsday has 7 prerequisites, once each, target excluded", () => {
  const plan = buildRewatchPlan(mcu, 8);
  assert.equal(plan.totalMovies, 7);
  assert.deepEqual([...plan.movies.map((m) => m.id)].sort(), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(plan.watchedCount, 0);
  assert.equal(plan.unwatchedCount, 7);
  assert.equal(plan.remainingRuntime, 700);
  assertPrerequisitesFirst(plan, mcu);
});

test("rewatch: Civil War -> Iron Man, Cap, Avengers", () => {
  const plan = buildRewatchPlan(mcu, 4);
  assert.deepEqual([...plan.movies.map((m) => m.id)].sort(), [1, 2, 3]);
  assertPrerequisitesFirst(plan, mcu);
});

test("rewatch: no prerequisites gives an empty plan", () => {
  const plan = buildRewatchPlan(mcu, 5);
  assert.deepEqual(plan, {
    movies: [],
    totalMovies: 0,
    watchedCount: 0,
    unwatchedCount: 0,
    remainingRuntime: 0,
  });
});

test("rewatch: watched movies are counted but not added to remaining runtime", () => {
  const withWatched = mcu.map((m) => (m.id === 1 || m.id === 7 ? { ...m, watched: true } : m));
  const plan = buildRewatchPlan(withWatched, 8);
  assert.equal(plan.watchedCount, 2);
  assert.equal(plan.unwatchedCount, 5);
  assert.equal(plan.remainingRuntime, 500);
});

test("rewatch: watched target is not counted", () => {
  const plan = buildRewatchPlan(mcu.map((m) => (m.id === 8 ? { ...m, watched: true } : m)), 8);
  assert.equal(plan.watchedCount, 0);
});

test("rewatch: diamond (converging paths) lists shared movie once", () => {
  const diamond = [movie(1, []), movie(2, [1]), movie(3, [1]), movie(4, [2, 3])];
  const plan = buildRewatchPlan(diamond, 4);
  assert.equal(plan.totalMovies, 3);
  assert.equal(plan.movies[0].id, 1);
});

test("rewatch: defensive cycle in stored data throws", () => {
  const cyclic = [movie(1, [2]), movie(2, [1])];
  assert.throws(() => buildRewatchPlan(cyclic, 1), CircularDependencyError);
});

test("cycle: self and indirect dependencies detected", () => {
  // dependsOn(p, m): does p already require m? If so, p can't become a prerequisite of m.
  assert.equal(dependsOn(mcu, 1, 1), true); // self
  assert.equal(dependsOn(mcu, 7, 1), true); // Endgame requires Iron Man -> Endgame can't be Iron Man's prerequisite
  assert.equal(dependsOn(mcu, 8, 5), true);
  assert.equal(dependsOn(mcu, 1, 7), false); // Iron Man doesn't require Endgame
  assert.equal(dependsOn(mcu, 5, 1), false); // Ragnarok unrelated to Iron Man
});
