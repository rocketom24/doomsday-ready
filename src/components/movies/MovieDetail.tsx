"use client";

import Image from "next/image";
import { motion, type Variants } from "motion/react";
import { Check, ListOrdered, X } from "lucide-react";
import { useEffect, useRef } from "react";
import Poster from "@/components/ui/Poster";
import { posterFor } from "@/lib/posters";
import type { Movie } from "@/lib/types";

// "2h 6m" (the card/list helper pads minutes; this view wants it unpadded).
function runtimeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const ease = [0.22, 1, 0.36, 1] as const;

const stagger: Variants = {
  hidden: {},
  show: { transition: { delayChildren: 0.14, staggerChildren: 0.07 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
};
// Title words slide up out of a clipped line, film-credit style.
const word: Variants = {
  hidden: { y: "105%" },
  show: { y: "0%", transition: { duration: 0.55, ease } },
};

export default function MovieDetail({
  movie,
  busy,
  onToggle,
  onViewRewatch,
  onClose,
}: {
  movie: Movie;
  busy: boolean;
  onToggle: () => void;
  onViewRewatch: () => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  const art = posterFor(movie.title);
  const chain = movie.prerequisites.length;

  // Scroll lock, Escape, Tab focus trap, and focus restore to whatever opened the dialog.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") return closeRef.current();
      if (e.key !== "Tab" || !panel.current) return;
      const items = panel.current.querySelectorAll<HTMLElement>("button:not([disabled])");
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/75 backdrop-blur-sm sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* clip-path (not transform) so the shared poster layout animation stays accurate */}
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-detail-title"
        initial={{ opacity: 0, clipPath: "inset(8% 6% 8% 6%)" }}
        animate={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
        exit={{ opacity: 0, clipPath: "inset(4% 3% 4% 3%)" }}
        transition={{ duration: 0.45, ease }}
        className="relative my-auto w-full max-w-5xl overflow-hidden border border-line bg-ink"
      >
        {/* The film's own artwork, enlarged and dimmed, as the room behind the content. */}
        {art && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease }}
          >
            <Image src={art} alt="" fill unoptimized sizes="64rem" className="object-cover object-top opacity-50 grayscale" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink to-transparent" />
          </motion.div>
        )}

        {/* Outlined year, a poster-credit watermark. */}
        <motion.span
          aria-hidden
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.2 }}
          className="tnum pointer-events-none absolute -right-4 -bottom-10 font-display text-[9rem] leading-none font-bold text-transparent select-none sm:text-[16rem]"
          style={{ WebkitTextStroke: "1px var(--color-line-strong)" }}
        >
          {movie.releaseYear}
        </motion.span>

        <div className="relative">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, ease, delay: 0.15 }}
            style={{ originX: 0 }}
            className="h-[5px] bg-accent"
          />
          <button
            ref={closeBtn}
            type="button"
            onClick={onClose}
            aria-label="Close movie details"
            className="absolute top-3 right-3 z-10 grid size-10 place-items-center border border-line-strong bg-ink/70 text-bone transition-colors hover:border-accent hover:bg-accent"
          >
            <X size={18} aria-hidden />
          </button>

          <div className="grid gap-8 p-5 pt-8 sm:grid-cols-[17rem_1fr] sm:gap-12 sm:p-10">
            <motion.div
              layoutId={`poster-${movie.id}`}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="mx-auto w-44 self-start shadow-[10px_10px_0_0_var(--color-accent)] sm:mx-0 sm:w-full"
            >
              <Poster title={movie.title} priority className="w-full" />
            </motion.div>

            <motion.div variants={stagger} initial="hidden" animate="show" className="flex min-w-0 flex-col">
              <motion.p variants={rise} className="flex items-center gap-3 font-display text-sm font-semibold tracking-[0.2em] text-ash uppercase">
                <span className="h-px w-8 bg-accent" aria-hidden />
                {movie.watched ? "Seen it" : "Still to watch"}
              </motion.p>

              <h2
                id="movie-detail-title"
                className="mt-3 pr-12 font-display text-5xl leading-[0.95] font-bold tracking-tight uppercase sm:text-7xl"
              >
                {movie.title.split(" ").map((w, i) => (
                  <span key={i} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
                    <motion.span variants={word} className="inline-block">
                      {w}
                    </motion.span>
                  </span>
                ))}
              </h2>

              <motion.dl variants={rise} className="mt-8 grid grid-cols-3 border-y border-line-strong">
                {[
                  { k: "Released", v: String(movie.releaseYear) },
                  { k: "Runtime", v: runtimeLabel(movie.runtime) },
                  { k: "Status", v: movie.watched ? "Watched" : "Unwatched" },
                ].map((s, i) => (
                  <div key={s.k} className={`py-3 ${i > 0 ? "border-l border-line-strong pl-4" : "pr-4"}`}>
                    <dt className="text-xs tracking-[0.15em] text-ash uppercase">{s.k}</dt>
                    <dd className="tnum mt-1 flex items-center gap-1.5 font-display text-xl font-semibold uppercase sm:text-2xl">
                      {s.k === "Status" && movie.watched && <Check size={16} className="text-accent" aria-hidden />}
                      {s.v}
                    </dd>
                  </div>
                ))}
              </motion.dl>

              <motion.section variants={rise} className="mt-8" aria-label="Prerequisites">
                <h3 className="font-display text-sm font-semibold tracking-[0.2em] text-ash uppercase">
                  {chain === 0 ? "Prerequisites" : "Watch first"}
                </h3>
                {chain === 0 ? (
                  <p className="mt-3 text-bone">No prerequisites</p>
                ) : (
                  <ol className="relative mt-4 space-y-3 pl-7">
                    <motion.span
                      aria-hidden
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.7, ease, delay: 0.45 }}
                      style={{ originY: 0 }}
                      className="absolute top-2 bottom-2 left-[5px] w-px bg-line-strong"
                    />
                    {movie.prerequisites.map((p) => (
                      <li key={p.id} className="relative flex items-baseline justify-between gap-4">
                        <span
                          aria-hidden
                          className={`absolute top-[0.55em] -left-7 size-[11px] border ${
                            p.watched ? "border-accent bg-accent" : "border-ash bg-ink"
                          }`}
                        />
                        <span className={p.watched ? "text-ash line-through decoration-line-strong" : "text-bone"}>
                          {p.title}
                          {p.watched && <span className="sr-only"> (watched)</span>}
                        </span>
                        <span className="tnum text-sm text-ash">{p.releaseYear}</span>
                      </li>
                    ))}
                    <li className="relative flex items-baseline gap-4 font-display text-lg font-semibold uppercase">
                      <span aria-hidden className="absolute top-[0.5em] -left-7 size-[11px] border border-bone bg-bone" />
                      {movie.title}
                    </li>
                  </ol>
                )}
              </motion.section>

              <motion.div variants={rise} className="mt-10 flex flex-col gap-2 sm:flex-row">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={onToggle}
                  disabled={busy}
                  aria-pressed={movie.watched}
                  className={`btn flex-1 border px-5 py-3.5 text-base ${
                    movie.watched ? "border-accent bg-ink/60 text-bone enabled:hover:bg-accent/10" : "btn-primary"
                  }`}
                >
                  {movie.watched ? (
                    <>
                      <Check size={16} aria-hidden />
                      Watched · undo
                    </>
                  ) : (
                    "Mark watched"
                  )}
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={onViewRewatch}
                  className="btn btn-secondary flex-1 border bg-ink/60 px-5 py-3.5 text-base"
                >
                  <ListOrdered size={16} aria-hidden />
                  Rewatch plan
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
