"use client";

import { motion } from "motion/react";
import { Check, Film } from "lucide-react";
import { useEffect, useState } from "react";
import Poster from "@/components/ui/Poster";
import Select from "@/components/ui/Select";
import { EmptyBlock, ErrorBlock, LoadingBlock, SectionHeading, StatRow } from "@/components/ui/Panels";
import { api, errorMessage, formatRuntime } from "@/lib/client";
import type { Movie, RewatchPlan } from "@/lib/types";

export default function RewatchProtocol({
  movies,
  version,
  initialTarget = null,
  pending,
  onToggleWatched,
}: {
  movies: Movie[];
  version: number;
  initialTarget?: number | null;
  pending: number[];
  onToggleWatched: (id: number, watched: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(initialTarget);
  const [plan, setPlan] = useState<RewatchPlan | null>(null);
  const [failure, setFailure] = useState<{ id: number; message: string } | null>(null);
  const [retry, setRetry] = useState(0);

  // Default target: Avengers: Doomsday if it exists, otherwise the newest film.
  const fallback = movies.find((m) => /doomsday/i.test(m.title)) ?? movies[movies.length - 1];
  const targetId = picked ?? fallback?.id ?? null;

  useEffect(() => {
    if (targetId === null) return;
    let cancelled = false;
    api<RewatchPlan>(`/api/movies/${targetId}/rewatch-order`)
      .then((p) => {
        if (cancelled) return;
        setPlan(p);
        setFailure(null);
      })
      .catch((e) => !cancelled && setFailure({ id: targetId, message: errorMessage(e) }));
    return () => {
      cancelled = true;
    };
  }, [targetId, version, retry]);

  const options = movies.map((m) => ({ value: m.id, label: m.title, hint: String(m.releaseYear) }));
  const failed = failure && failure.id === targetId ? failure : null;
  // Keep showing the previous plan while a refresh for the same target is in flight.
  const fetched = plan && plan.target.id === targetId ? plan : null;
  // Overlay the optimistic watched flags from app state so a click shows instantly.
  // Order and membership still come straight from the API; the refetch confirms the numbers.
  const current = fetched ? withLiveWatched(fetched, movies) : null;
  const percent = current && current.totalMovies > 0 ? Math.round((current.watchedCount / current.totalMovies) * 100) : 0;

  return (
    <section aria-labelledby="rewatch-h">
      <SectionHeading
        title="Rewatch protocol"
        text="Pick a film. The plan lists everything it depends on, in the order to watch it."
      />

      <div className="mt-8 max-w-xl">
        <Select label="Target movie" options={options} value={targetId} onChange={setPicked} />
      </div>

      {movies.length === 0 ? (
        <div className="mt-8">
          <EmptyBlock>Add a movie first to build a rewatch plan.</EmptyBlock>
        </div>
      ) : failed ? (
        <div className="mt-8">
          <ErrorBlock
            text={failed.message}
            onRetry={() => {
              setFailure(null);
              setRetry((r) => r + 1);
            }}
          />
        </div>
      ) : !current ? (
        <div className="mt-8">
          <LoadingBlock text="Building rewatch plan…" />
        </div>
      ) : (
        <div className="mt-8">
          <StatRow
            items={[
              { label: "Prerequisites", value: current.totalMovies },
              { label: "Watched", value: current.watchedCount },
              { label: "Left to watch", value: current.unwatchedCount },
              { label: "Runtime remaining", value: formatRuntime(current.remainingRuntime) },
            ]}
          />

          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <p className="font-medium">
                {current.watchedCount} / {current.totalMovies} movies completed
              </p>
              <p className="tnum text-ash">{percent}%</p>
            </div>
            <div
              className="mt-2 h-1.5 rounded-sm bg-wine"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label="Prerequisites watched"
            >
              <div className="h-full rounded-sm bg-accent transition-[width] duration-300 ease-out" style={{ width: `${percent}%` }} />
            </div>
          </div>

          <Timeline plan={current} pending={pending} onToggleWatched={onToggleWatched} />
        </div>
      )}
    </section>
  );
}

function Timeline({
  plan,
  pending,
  onToggleWatched,
}: {
  plan: RewatchPlan;
  pending: number[];
  onToggleWatched: (id: number, watched: boolean) => void;
}) {
  if (plan.totalMovies === 0) {
    return (
      <div className="mt-8">
        <EmptyBlock>{plan.target.title} has no prerequisites. Nothing to rewatch first.</EmptyBlock>
      </div>
    );
  }

  const ready = plan.unwatchedCount === 0;

  return (
    <ol className="mt-8">
      {plan.movies.map((m, i) => (
        <motion.li
          key={m.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: Math.min(i, 10) * 0.07 }}
          className="relative grid grid-cols-[2rem_1fr] gap-x-4 pb-3 sm:gap-x-5"
        >
          {/* Thin spine to the next step; it turns red once this step is watched. */}
          <span aria-hidden className="absolute top-8 bottom-0 left-4 w-px -translate-x-1/2 bg-line-strong" />
          <span
            aria-hidden
            className={`absolute top-8 bottom-0 left-4 w-px -translate-x-1/2 bg-accent transition-opacity duration-300 ${m.watched ? "opacity-100" : "opacity-0"}`}
          />
          <span
            className={`relative z-10 grid size-8 place-items-center rounded-sm border text-sm font-medium transition-colors duration-200 ${
              m.watched ? "border-accent bg-accent text-bone" : "border-line-strong bg-ink text-ash"
            }`}
          >
            {m.watched ? <Check size={16} aria-label="Watched" /> : <span className="tnum">{i + 1}</span>}
          </span>

          <div
            className={`flex items-center gap-4 rounded border p-3 transition-[colors,transform] duration-200 hover:translate-x-1 ${
              m.watched ? "border-wine bg-oxblood" : "border-line-strong bg-card"
            }`}
          >
            <Poster title={m.title} className={`w-12 shrink-0 sm:w-14 ${m.watched ? "opacity-60" : ""}`} />
            <div className="min-w-0 flex-1">
              <h3 className={`leading-snug font-semibold ${m.watched ? "text-ash" : ""}`}><span className="sr-only">Step {i + 1}: </span>{m.title}</h3>
              <p className="tnum mt-0.5 text-sm text-ash">
                {m.releaseYear}, {formatRuntime(m.runtime)}
              </p>
            </div>
            <button
              type="button"
              disabled={pending.includes(m.id)}
              aria-pressed={m.watched}
              onClick={() => onToggleWatched(m.id, !m.watched)}
              title={m.watched ? "Mark as unwatched" : undefined}
              className={`btn shrink-0 border ${m.watched ? "border-accent text-bone enabled:hover:bg-accent/10" : "btn-secondary"}`}
            >
              {m.watched ? (
                <>
                  <Check size={15} aria-hidden />
                  Watched
                </>
              ) : (
                "Mark watched"
              )}
            </button>
          </div>
        </motion.li>
      ))}

      <li className="grid grid-cols-[2rem_1fr] items-center gap-x-4 sm:gap-x-5">
        <span
          className={`grid size-8 place-items-center rounded-sm border transition-colors duration-200 ${
            ready ? "border-accent bg-accent text-bone" : "border-line-strong bg-ink text-ash"
          }`}
        >
          <Film size={16} aria-hidden />
        </span>
        <p>
          <span className="block text-sm text-ash">{ready ? "You are ready for" : "Destination"}</span>
          <span className="font-display text-3xl font-bold tracking-wide uppercase">{plan.target.title}</span>
        </p>
      </li>
    </ol>
  );
}

function withLiveWatched(plan: RewatchPlan, movies: Movie[]): RewatchPlan {
  const live = new Map(movies.map((m) => [m.id, m.watched]));
  const list = plan.movies.map((m) => ({ ...m, watched: live.get(m.id) ?? m.watched }));
  const unwatched = list.filter((m) => !m.watched);
  return {
    ...plan,
    movies: list,
    watchedCount: list.length - unwatched.length,
    unwatchedCount: unwatched.length,
    remainingRuntime: unwatched.reduce((sum, m) => sum + m.runtime, 0),
  };
}
