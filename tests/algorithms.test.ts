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

// ---- extra booking coverage ---------------------------------------------

// Independent reference: plain recursion with memo, returns the fewest bundles or Infinity.
function bruteForceFewest(sizes: number[], n: number, memo = new Map<number, number>()): number {
  if (n === 0) return 0;
  if (memo.has(n)) return memo.get(n)!;
  let best = Infinity;
  for (const s of sizes) if (s <= n) best = Math.min(best, 1 + bruteForceFewest(sizes, n - s, memo));
  memo.set(n, best);
  return best;
}

test("booking: exact bundle match is one bundle", () => {
  assert.deepEqual(minBundles([3, 7, 11], 7), [{ size: 7, count: 1 }]);
});

test("booking: smallest bundle repeated", () => {
  assert.deepEqual(minBundles([1], 9), [{ size: 1, count: 9 }]);
});

test("booking: sizes near 500 (499, 500)", () => {
  assert.deepEqual(minBundles([499, 500], 999), [
    { size: 500, count: 1 },
    { size: 499, count: 1 },
  ]);
  assert.equal(minBundles([499, 500], 1000)!.length, 1); // 2 x 500
  assert.equal(minBundles([499, 500], 501), null);
});

test("booking: group 10000 with awkward sizes is exact and minimal", () => {
  const r = minBundles([499, 500, 3], 10000);
  assert.equal(seats(r), 10000);
  assert.equal(total(r), bruteForceFewest([499, 500, 3], 10000));
});

test("booking: impossible returns null, never a fake combination", () => {
  assert.equal(minBundles([6, 9, 20], 7), null);
  assert.equal(minBundles([10, 20], 15), null);
  assert.equal(minBundles([500], 499), null);
});

test("booking: matches brute force for every group size, in any input order", () => {
  const sets = [[1, 3, 4], [2, 5], [6, 9, 20], [4, 6], [5, 2, 7], [9, 6, 20], [7, 13, 50], [1, 15, 25]];
  for (const sizes of sets) {
    for (let n = 1; n <= 150; n++) {
      const expected = bruteForceFewest(sizes, n);
      const r = minBundles(sizes, n);
      if (expected === Infinity) {
        assert.equal(r, null, `[${sizes}] n=${n} should be impossible`);
      } else {
        assert.equal(seats(r), n, `[${sizes}] n=${n} must sum exactly`);
        assert.equal(total(r), expected, `[${sizes}] n=${n} must be minimal`);
        assert.ok(r!.every((b) => sizes.includes(b.size) && b.count > 0));
      }
    }
  }
});

// ---- extra rewatch coverage ---------------------------------------------

test("rewatch: one prerequisite", () => {
  const plan = buildRewatchPlan([movie(1, []), movie(2, [1])], 2);
  assert.deepEqual(plan.movies.map((m) => m.id), [1]);
});

test("rewatch: deep chain keeps strict order", () => {
  const chain = Array.from({ length: 200 }, (_, i) => movie(i + 1, i === 0 ? [] : [i]));
  const plan = buildRewatchPlan(chain, 200);
  assert.deepEqual(plan.movies.map((m) => m.id), Array.from({ length: 199 }, (_, i) => i + 1));
});

test("rewatch: shared dependency reached by many paths appears once", () => {
  // 1 <- 2,3,4 <- 5 ; 5 also lists 1 directly
  const g = [movie(1, []), movie(2, [1]), movie(3, [1]), movie(4, [1]), movie(5, [2, 3, 4, 1])];
  const plan = buildRewatchPlan(g, 5);
  const ids = plan.movies.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 4);
  assert.equal(ids[0], 1);
  assertPrerequisitesFirst(plan, g);
});

test("rewatch: target never appears and unrelated movies are excluded", () => {
  const plan = buildRewatchPlan(mcu, 6);
  const ids = plan.movies.map((m) => m.id);
  assert.ok(!ids.includes(6) && !ids.includes(7) && !ids.includes(8));
  assert.deepEqual([...ids].sort(), [1, 2, 3, 4, 5]);
});

test("rewatch: any listing order of prerequisites gives a valid order", () => {
  const shuffled = [
    movie(3, [2, 1]), movie(8, [7]), movie(1, []), movie(7, [6]),
    movie(6, [5, 4]), movie(5, []), movie(4, [3]), movie(2, []),
  ];
  const plan = buildRewatchPlan(shuffled, 8);
  assert.equal(plan.totalMovies, 7);
  assertPrerequisitesFirst(plan, shuffled);
});

test("rewatch: runtime counts only unwatched prerequisites", () => {
  const g = [
    movie(1, [], { runtime: 90, watched: true }),
    movie(2, [1], { runtime: 120 }),
    movie(3, [2], { runtime: 45 }),
    movie(4, [3], { runtime: 999 }),
  ];
  const plan = buildRewatchPlan(g, 4);
  assert.equal(plan.watchedCount, 1);
  assert.equal(plan.unwatchedCount, 2);
  assert.equal(plan.remainingRuntime, 165);
});

test("rewatch: longer corrupted cycle (1->2->3->1) throws", () => {
  assert.throws(() => buildRewatchPlan([movie(1, [3]), movie(2, [1]), movie(3, [2])], 2), CircularDependencyError);
});

test("cycle: indirect loop through a long chain is detected, siblings are not", () => {
  const chain = [movie(1, []), movie(2, [1]), movie(3, [2]), movie(4, [3]), movie(5, [])];
  assert.equal(dependsOn(chain, 4, 1), true); // 4 requires 1 -> 4 cannot be a prerequisite of 1
  assert.equal(dependsOn(chain, 5, 1), false);
  assert.equal(dependsOn(chain, 1, 4), false); // 1 does not require 4
});
