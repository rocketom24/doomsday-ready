// API tests: call the real route handlers against a throwaway SQLite database created in the
// OS temp dir from the project's migrations. prisma/dev.db is never opened.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const dir = mkdtempSync(path.join(tmpdir(), "doomsday-api-"));
process.env.DATABASE_URL = `file:${path.join(dir, "test.db").replace(/\\/g, "/")}`;

type Ctx = { params: Promise<{ id: string }> };
type Handler = (req: Request, ctx: Ctx) => Promise<Response>;
type Json = any; // eslint-disable-line @typescript-eslint/no-explicit-any

let movies: { GET: Handler; POST: Handler };
let movieById: { PATCH: Handler };
let rewatch: { GET: Handler };
let cinemas: { GET: Handler; POST: Handler };
let booking: { GET: Handler };
let prisma: typeof import("../src/lib/prisma").prisma;

before(async () => {
  execSync("npx prisma migrate deploy", { env: process.env, stdio: "pipe" });
  prisma = (await import("../src/lib/prisma")).prisma;
  movies = (await import("../src/app/api/movies/route")) as never;
  movieById = (await import("../src/app/api/movies/[id]/route")) as never;
  rewatch = (await import("../src/app/api/movies/[id]/rewatch-order/route")) as never;
  cinemas = (await import("../src/app/api/cinemas/route")) as never;
  booking = (await import("../src/app/api/cinemas/[id]/booking/route")) as never;
});

after(async () => {
  await prisma?.$disconnect();
  rmSync(dir, { recursive: true, force: true });
});

const ctx = (id: string | number): Ctx => ({ params: Promise.resolve({ id: String(id) }) });
const noParams = ctx("");
const get = (url = "http://test/api") => new Request(url);
const send = (method: string, body: unknown, raw = false) =>
  new Request("http://test/api", {
    method,
    headers: { "content-type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });

async function call(res: Promise<Response>): Promise<{ status: number; body: Json }> {
  const r = await res;
  return { status: r.status, body: await r.json() };
}
const createMovie = (data: object) => call(movies.POST(send("POST", data), noParams));
const patchMovie = (id: string | number, data: unknown, raw = false) =>
  call(movieById.PATCH(send("PATCH", data, raw), ctx(id)));
const listMovies = async (): Promise<Json[]> => (await call(movies.GET(get(), noParams))).body;
const listCinemas = async (): Promise<Json[]> => (await call(cinemas.GET(get(), noParams))).body;
const prereqIds = async (id: number) =>
  (await listMovies()).find((m) => m.id === id).prerequisites.map((p: { id: number }) => p.id).sort();

// ---- movies --------------------------------------------------------------

let A: number, B: number, C: number;

test("movies: empty list, then valid create", async () => {
  assert.deepEqual(await listMovies(), []);
  const a = await createMovie({ title: "A", releaseYear: 2000, runtime: 100 });
  assert.equal(a.status, 201);
  assert.equal(a.body.watched, false); // defaults to unwatched
  assert.deepEqual(a.body.prerequisites, []);
  A = a.body.id;
  B = (await createMovie({ title: "B", releaseYear: 2001, runtime: 110, prerequisites: [A] })).body.id;
  C = (await createMovie({ title: "C", releaseYear: 2002, runtime: 120, prerequisites: [B] })).body.id;
  assert.deepEqual(await prereqIds(B), [A]);
  assert.equal((await listMovies()).length, 3);
});

test("movies: invalid create is rejected with 400", async () => {
  const bad = [
    {},
    { title: "", releaseYear: 2000, runtime: 100 },
    { title: "   ", releaseYear: 2000, runtime: 100 },
    { title: "X", releaseYear: 2000, runtime: 0 },
    { title: "X", releaseYear: 2000, runtime: 301 },
    { title: "X", releaseYear: 2000, runtime: 90.5 },
    { title: "X", releaseYear: 2000, runtime: "90" },
    { title: "X", releaseYear: 1700, runtime: 90 },
    { title: "X", releaseYear: 2000, runtime: 90, prerequisites: [A, A] },
    { title: "X", releaseYear: 2000, runtime: 90, prerequisites: [-1] },
  ];
  for (const data of bad) {
    const r = await createMovie(data);
    assert.equal(r.status, 400, JSON.stringify(data));
    assert.equal(r.body.error.code, "VALIDATION_ERROR");
  }
  const malformed = await call(movies.POST(send("POST", "{not json", true), noParams));
  assert.equal(malformed.status, 400);
  assert.equal((await listMovies()).length, 3);
});

test("movies: runtime boundaries 1 and 300 are accepted", async () => {
  assert.equal((await createMovie({ title: "Short", releaseYear: 2003, runtime: 1 })).status, 201);
  assert.equal((await createMovie({ title: "Long", releaseYear: 2003, runtime: 300 })).status, 201);
});

test("movies: duplicate title -> 409 DUPLICATE_TITLE", async () => {
  const r = await createMovie({ title: "A", releaseYear: 1999, runtime: 90 });
  assert.equal(r.status, 409);
  assert.equal(r.body.error.code, "DUPLICATE_TITLE");
});

test("movies: create with unknown prerequisite -> 404 and nothing created", async () => {
  const count = (await listMovies()).length;
  const r = await createMovie({ title: "Ghost", releaseYear: 2010, runtime: 90, prerequisites: [9999] });
  assert.equal(r.status, 404);
  assert.equal((await listMovies()).length, count);
});

test("movies: PATCH watched / title / runtime", async () => {
  let r = await patchMovie(A, { watched: true });
  assert.equal(r.status, 200);
  assert.equal(r.body.watched, true);
  r = await patchMovie(A, { watched: false });
  assert.equal(r.body.watched, false);
  r = await patchMovie(A, { title: "A2", runtime: 101 });
  assert.equal(r.body.title, "A2");
  assert.equal(r.body.runtime, 101);
  assert.equal(r.body.releaseYear, 2000); // untouched fields kept
  await patchMovie(A, { title: "A", runtime: 100 });
});

test("movies: PATCH to an existing title -> 409", async () => {
  const r = await patchMovie(B, { title: "A" });
  assert.equal(r.status, 409);
  assert.equal(r.body.error.code, "DUPLICATE_TITLE");
});

test("movies: PATCH rejects bad ids, empty payload, bad values, unknown movie", async () => {
  assert.equal((await patchMovie(99999, { watched: true })).status, 404);
  assert.equal((await patchMovie("abc", { watched: true })).status, 400);
  assert.equal((await patchMovie(0, { watched: true })).status, 400);
  assert.equal((await patchMovie(A, {})).status, 400);
  assert.equal((await patchMovie(A, { runtime: 999 })).status, 400);
  assert.equal((await patchMovie(A, { watched: "yes" })).status, 400);
  assert.equal((await patchMovie(A, "oops", true)).status, 400);
});

test("movies: PATCH prerequisites set, replace, clear; unknown id and duplicates rejected", async () => {
  const D = (await createMovie({ title: "D", releaseYear: 2005, runtime: 90 })).body.id;
  assert.equal((await patchMovie(D, { prerequisites: [A, B] })).status, 200);
  assert.deepEqual(await prereqIds(D), [A, B].sort());
  assert.equal((await patchMovie(D, { prerequisites: [C] })).status, 200);
  assert.deepEqual(await prereqIds(D), [C]);

  assert.equal((await patchMovie(D, { prerequisites: [424242] })).status, 404);
  assert.equal((await patchMovie(D, { prerequisites: [A, A] })).status, 400);
  assert.deepEqual(await prereqIds(D), [C]); // failed requests changed nothing

  assert.equal((await patchMovie(D, { prerequisites: [] })).status, 200);
  assert.deepEqual(await prereqIds(D), []);
});

test("movies: self dependency -> 409 CIRCULAR_DEPENDENCY", async () => {
  const r = await patchMovie(A, { prerequisites: [A] });
  assert.equal(r.status, 409);
  assert.equal(r.body.error.code, "CIRCULAR_DEPENDENCY");
});

test("movies: direct and indirect cycles -> 409 and the data is left untouched", async () => {
  // chain: A <- B <- C
  const snapshot = JSON.stringify(await listMovies());

  const direct = await patchMovie(A, { prerequisites: [B] });
  assert.equal(direct.status, 409);
  assert.equal(direct.body.error.code, "CIRCULAR_DEPENDENCY");

  const indirect = await patchMovie(A, { prerequisites: [C] });
  assert.equal(indirect.status, 409);
  assert.equal(indirect.body.error.code, "CIRCULAR_DEPENDENCY");

  // a request that changes other fields AND creates a cycle must apply neither
  const mixed = await patchMovie(A, { runtime: 250, watched: true, prerequisites: [C] });
  assert.equal(mixed.status, 409);

  assert.equal(JSON.stringify(await listMovies()), snapshot);
  const rows = await prisma.movie.findMany({ include: { prerequisites: true } });
  assert.deepEqual(rows.find((m) => m.id === A)!.prerequisites, []);
});

// ---- rewatch -------------------------------------------------------------

const rewatchOf = (id: string | number) => call(rewatch.GET(get(), ctx(id)));

test("rewatch: no prerequisites -> empty plan", async () => {
  const r = await rewatchOf(A);
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.movies, []);
  assert.equal(r.body.totalMovies, 0);
  assert.equal(r.body.remainingRuntime, 0);
  assert.equal(r.body.target.id, A);
});

test("rewatch: chain order, target excluded, watched count and runtime", async () => {
  let r = await rewatchOf(C);
  assert.deepEqual(r.body.movies.map((m: { id: number }) => m.id), [A, B]);
  assert.equal(r.body.totalMovies, 2);
  assert.equal(r.body.watchedCount, 0);
  assert.equal(r.body.remainingRuntime, 100 + 110);

  await patchMovie(A, { watched: true });
  r = await rewatchOf(C);
  assert.equal(r.body.watchedCount, 1);
  assert.equal(r.body.unwatchedCount, 1);
  assert.equal(r.body.remainingRuntime, 110);
  await patchMovie(A, { watched: false });
});

test("rewatch: unknown or invalid movie id", async () => {
  assert.equal((await rewatchOf(77777)).status, 404);
  assert.equal((await rewatchOf("x")).status, 400);
});

// ---- cinemas -------------------------------------------------------------

const createCinema = (data: unknown) => call(cinemas.POST(send("POST", data), noParams));
const bookingOf = (id: string | number, groupSize?: string) =>
  call(booking.GET(get(`http://test/api${groupSize === undefined ? "" : `?groupSize=${groupSize}`}`), ctx(id)));
let cinemaId: number;

test("cinemas: empty list, valid create (sizes stored sorted), list", async () => {
  assert.deepEqual(await listCinemas(), []);
  const r = await createCinema({ name: "Test Cinema", bundleSizes: [5, 2] });
  assert.equal(r.status, 201);
  assert.deepEqual(r.body.bundleSizes, [2, 5]);
  cinemaId = r.body.id;
  assert.deepEqual(await listCinemas(), [{ id: cinemaId, name: "Test Cinema", bundleSizes: [2, 5] }]);
});

test("cinemas: duplicate name -> 409 DUPLICATE_CINEMA", async () => {
  const r = await createCinema({ name: "Test Cinema", bundleSizes: [3] });
  assert.equal(r.status, 409);
  assert.equal(r.body.error.code, "DUPLICATE_CINEMA");
});

test("cinemas: invalid payloads -> 400", async () => {
  const bad = [
    { name: "", bundleSizes: [3] },
    { name: "X" },
    { name: "X", bundleSizes: [] },
    { name: "X", bundleSizes: [0] },
    { name: "X", bundleSizes: [501] },
    { name: "X", bundleSizes: [-4] },
    { name: "X", bundleSizes: [2.5] },
    { name: "X", bundleSizes: ["3"] },
    { name: "X", bundleSizes: [3, 3] },
    { name: "X", bundleSizes: Array.from({ length: 11 }, (_, i) => i + 1) },
  ];
  for (const data of bad) {
    const r = await createCinema(data);
    assert.equal(r.status, 400, JSON.stringify(data));
    assert.equal(r.body.error.code, "VALIDATION_ERROR");
  }
  // boundaries are accepted
  assert.equal((await createCinema({ name: "Edges", bundleSizes: [1, 500] })).status, 201);
  assert.equal((await createCinema({ name: "Ten", bundleSizes: Array.from({ length: 10 }, (_, i) => i + 1) })).status, 201);
});

// ---- booking -------------------------------------------------------------

test("booking: minimum bundle combination (sizes 2 and 5, group 11)", async () => {
  const r = await bookingOf(cinemaId, "11");
  assert.equal(r.status, 200);
  assert.equal(r.body.possible, true);
  assert.equal(r.body.totalBundles, 4);
  assert.equal(r.body.totalSeats, 11);
  assert.deepEqual(r.body.bundles, [{ size: 5, count: 1 }, { size: 2, count: 3 }]);
});

test("booking: impossible group size is a 200 with no combination", async () => {
  const evens = (await createCinema({ name: "Evens", bundleSizes: [4, 6] })).body.id;
  const r = await bookingOf(evens, "7");
  assert.equal(r.status, 200);
  assert.equal(r.body.possible, false);
  assert.deepEqual(r.body.bundles, []);
  assert.equal(r.body.totalBundles, null);
});

test("booking: group size 1 and 10000", async () => {
  assert.equal((await bookingOf(cinemaId, "1")).body.possible, false); // sizes 2,5
  const big = await bookingOf(cinemaId, "10000");
  assert.equal(big.body.possible, true);
  assert.equal(big.body.totalSeats, 10000);
  assert.equal(big.body.totalBundles, 2000); // 2000 x 5
});

test("booking: invalid or missing group size -> 400", async () => {
  for (const g of [undefined, "", "0", "-3", "10001", "abc", "2.5", "1e3", " 5"]) {
    const r = await bookingOf(cinemaId, g);
    assert.equal(r.status, 400, `groupSize=${g}`);
    assert.equal(r.body.error.code, "VALIDATION_ERROR");
  }
});

test("booking: invalid or unknown cinema id", async () => {
  assert.equal((await bookingOf("abc", "5")).status, 400);
  assert.equal((await bookingOf(0, "5")).status, 400);
  assert.equal((await bookingOf(88888, "5")).status, 404);
});

test("booking: cinema with corrupted bundle data -> 500 without leaking details; list skips it", async () => {
  const bad = await prisma.cinema.create({ data: { name: "Broken", bundleSizes: "not json" } });
  const r = await bookingOf(bad.id, "5");
  assert.equal(r.status, 500);
  assert.equal(r.body.error.code, "INTERNAL_SERVER_ERROR");
  assert.ok(!(await listCinemas()).some((c) => c.name === "Broken"));
});
