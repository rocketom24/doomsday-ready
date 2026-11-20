"use client";

import { motion } from "motion/react";
import { Check, Clock, Pencil } from "lucide-react";
import Poster from "@/components/ui/Poster";
import { formatRuntime } from "@/lib/client";
import type { Movie } from "@/lib/types";

export default function MovieCard({
  movie,
  busy,
  onToggle,
  onEdit,
  onOpen,
  index = 0,
}: {
  movie: Movie;
  busy: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onOpen: () => void;
  index?: number;
}) {
  const count = movie.prerequisites.length;

  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: Math.min(index, 8) * 0.06 }}
      className="group flex flex-col border-t-[3px] border-t-transparent pt-0 transition-colors duration-300 hover:border-t-accent"
    >
      <motion.div className="relative" whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
        <button
          type="button"
          onClick={onOpen}
          aria-label={`View details for ${movie.title}`}
          className="block w-full cursor-pointer text-left"
        >
          <motion.div layoutId={`poster-${movie.id}`} transition={{ type: "spring", stiffness: 320, damping: 34 }}>
            <Poster title={movie.title} className="w-full transition-colors duration-200 group-hover:border-ash" />
          </motion.div>
        </button>
        {movie.watched && (
          <span className="pointer-events-none absolute top-2 left-2 grid size-6 place-items-center rounded-sm bg-accent text-bone" title="Watched">
            <Check size={14} aria-label="Watched" />
          </span>
        )}
      </motion.div>

      <div className="mt-3 flex-1">
        <h3 className="text-xl leading-tight">
          <button type="button" onClick={onOpen} className="cursor-pointer text-left transition-colors hover:text-ash">
            {movie.title}
          </button>
        </h3>
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
    </motion.li>
  );
}
