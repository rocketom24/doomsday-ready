"use client";

import { AnimatePresence } from "motion/react";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { EmptyBlock, PrimaryButton, SectionHeading, StatRow } from "@/components/ui/Panels";
import { formatRuntime } from "@/lib/client";
import type { Movie } from "@/lib/types";
import MovieCard from "./MovieCard";
import MovieForm from "./MovieForm";

type Filter = "all" | "watched" | "unwatched";
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "watched", label: "Watched" },
  { id: "unwatched", label: "Unwatched" },
];

export default function MovieDatabase({
  movies,
  pending,
  onToggleWatched,
  onSaved,
  notify,
}: {
  movies: Movie[];
  pending: number[];
  onToggleWatched: (id: number, watched: boolean) => void;
  onSaved: () => Promise<void>;
  notify: (tone: "success" | "error", text: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  // undefined = closed, null = adding, Movie = editing
  const [editing, setEditing] = useState<Movie | null | undefined>(undefined);

  const watched = movies.filter((m) => m.watched).length;
  const totalRuntime = movies.reduce((sum, m) => sum + m.runtime, 0);
  const q = query.trim().toLowerCase();
  const visible = movies.filter(
    (m) => (filter === "all" || (filter === "watched") === m.watched) && m.title.toLowerCase().includes(q),
  );

  return (
    <section aria-labelledby="movies-h">
      <SectionHeading
        title="Movie database"
        text="Mark what you have seen and set which films each one depends on."
        action={
          <PrimaryButton type="button" onClick={() => setEditing(null)}>
            <Plus size={16} aria-hidden />
            Add movie
          </PrimaryButton>
        }
      />

      <div className="mt-8">
        <StatRow
          items={[
            { label: "Films", value: movies.length },
            { label: "Watched", value: watched },
            { label: "Left to watch", value: movies.length - watched },
            { label: "Total runtime", value: formatRuntime(totalRuntime) },
          ]}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filter by status" className="inline-flex self-start rounded border border-line p-0.5">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-sm px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 ${
                filter === f.id ? "bg-wine text-bone" : "text-ash hover:text-bone"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <label htmlFor="movie-search" className="sr-only">
            Search movie titles
          </label>
          <Search size={16} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ash" />
          <input
            id="movie-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles"
            className="field pl-9"
          />
        </div>
      </div>

      {movies.length === 0 ? (
        <div className="mt-8">
          <EmptyBlock>No movies yet. Use Add movie to create the first one.</EmptyBlock>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-8">
          <EmptyBlock>No movies match this filter. Clear the search or switch to All.</EmptyBlock>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {visible.map((m, i) => (
            <MovieCard
              key={m.id}
              index={i}
              movie={m}
              busy={pending.includes(m.id)}
              onToggle={() => onToggleWatched(m.id, !m.watched)}
              onEdit={() => setEditing(m)}
            />
          ))}
        </ul>
      )}

      <AnimatePresence>
        {editing !== undefined && (
          <MovieForm
            key={editing?.id ?? "new"}
            movie={editing ?? undefined}
            movies={movies}
            onClose={() => setEditing(undefined)}
            onSaved={onSaved}
            notify={notify}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
