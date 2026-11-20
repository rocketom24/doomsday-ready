"use client";

import { Check, Clock, Pencil } from "lucide-react";
import Poster from "@/components/ui/Poster";
import { formatRuntime } from "@/lib/client";
import type { Movie } from "@/lib/types";

export default function MovieCard({
  movie,
  busy,
  onToggle,
  onEdit,
}: {
  movie: Movie;
  busy: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const count = movie.prerequisites.length;

  return (
    <li className="group flex flex-col border-t-[3px] border-t-transparent pt-0 transition-colors hover:border-t-accent">
      <div className="relative transition-transform duration-200 group-hover:-translate-y-0.5">
        <Poster title={movie.title} className="w-full transition-colors duration-200 group-hover:border-ash" />
        {movie.watched && (
          <span className="absolute top-2 left-2 grid size-6 place-items-center rounded-sm bg-accent text-bone" title="Watched">
            <Check size={14} aria-label="Watched" />
          </span>
        )}
      </div>

      <div className="mt-3 flex-1">
        <h3 className="text-xl leading-tight">{movie.title}</h3>
        <p className="tnum mt-1 flex items-center gap-3 text-sm text-ash">
          <span>{movie.releaseYear}</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} aria-hidden />
            {formatRuntime(movie.runtime)}
          </span>
        </p>
        <p className="mt-2 text-sm text-ash" title={count ? movie.prerequisites.map((p) => p.title).join(", ") : undefined}>
          {count === 0 ? "No prerequisites" : `Requires ${count} ${count === 1 ? "film" : "films"}`}
        </p>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          aria-pressed={movie.watched}
          title={movie.watched ? "Mark as unwatched" : undefined}
          className={`btn flex-1 border px-2 py-2 ${
            movie.watched ? "border-accent text-bone enabled:hover:bg-accent/10" : "btn-secondary"
          }`}
        >
          {movie.watched ? (
            <>
              <Check size={15} aria-hidden />
              Watched
            </>
          ) : (
            "Mark watched"
          )}
        </button>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${movie.title}`}
          className="btn btn-secondary px-2.5"
        >
          <Pencil size={15} aria-hidden />
        </button>
      </div>
    </li>
  );
}
