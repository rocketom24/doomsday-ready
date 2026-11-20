export type MovieSummary = {
  id: number;
  title: string;
  releaseYear: number;
  runtime: number;
  watched: boolean;
};

export type Movie = MovieSummary & {
  prerequisites: MovieSummary[];
  dependents: MovieSummary[];
};

export type RewatchPlan = {
  target: { id: number; title: string };
  movies: MovieSummary[];
  totalMovies: number;
  watchedCount: number;
  unwatchedCount: number;
  remainingRuntime: number;
};

export type Cinema = { id: number; name: string; bundleSizes: number[] };

export type BookingResult = {
  cinema: Cinema;
  groupSize: number;
  possible: boolean;
  totalBundles: number | null;
  totalSeats: number | null;
  bundles: { size: number; count: number }[];
  message?: string;
};
