"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Hero from "@/components/layout/Hero";
import Nav, { type Tab } from "@/components/layout/Nav";
import MovieDatabase from "@/components/movies/MovieDatabase";
import RewatchProtocol from "@/components/rewatch/RewatchProtocol";
import CinemaBooking from "@/components/booking/CinemaBooking";
import Toasts, { type ToastData } from "@/components/ui/Toast";
import { ErrorBlock, LoadingBlock } from "@/components/ui/Panels";
import { api, errorMessage, jsonBody } from "@/lib/client";
import type { Cinema, Movie } from "@/lib/types";

export default function DoomsdayApp() {
  const [tab, setTab] = useState<Tab>("movies");
  const [movies, setMovies] = useState<Movie[] | null>(null);
  const [cinemas, setCinemas] = useState<Cinema[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Bumped after every successful movie change so the rewatch plan knows to refetch.
  const [moviesVersion, setMoviesVersion] = useState(0);
  const [rewatchTarget, setRewatchTarget] = useState<number | null>(null);
  const [pending, setPending] = useState<number[]>([]);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api<Movie[]>("/api/movies"), api<Cinema[]>("/api/cinemas")])
      .then(([m, c]) => {
        if (cancelled) return;
        setMovies(m);
        setCinemas(c);
      })
      .catch((e) => !cancelled && setLoadError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const notify = useCallback((tone: ToastData["tone"], text: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const refreshMovies = useCallback(async () => {
    setMovies(await api<Movie[]>("/api/movies"));
    setMoviesVersion((v) => v + 1);
  }, []);

  const refreshCinemas = useCallback(async () => {
    setCinemas(await api<Cinema[]>("/api/cinemas"));
  }, []);

  // Optimistic: flip locally, PATCH only { watched }, roll back if the request fails.
  const toggleWatched = useCallback(
    async (id: number, watched: boolean) => {
      const flip = (value: boolean) =>
        setMovies((list) => list?.map((m) => (m.id === id ? { ...m, watched: value } : m)) ?? null);
      flip(watched);
      setPending((p) => [...p, id]);
      try {
        await api(`/api/movies/${id}`, jsonBody("PATCH", { watched }));
        setMoviesVersion((v) => v + 1);
      } catch (e) {
        flip(!watched);
        notify("error", errorMessage(e));
      } finally {
        setPending((p) => p.filter((x) => x !== id));
      }
    },
    [notify],
  );

  const ready = movies && cinemas;

  return (
    <MotionConfig reducedMotion="user">
      <Hero />
      <Nav tab={tab} onChange={setTab} />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        {loadError ? (
          <ErrorBlock
            text={loadError}
            onRetry={() => {
              setLoadError(null);
              setReloadKey((k) => k + 1);
            }}
          />
        ) : !ready ? (
          <LoadingBlock text="Loading the timeline…" />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {tab === "movies" && (
                <MovieDatabase
                  movies={movies}
                  pending={pending}
                  onToggleWatched={toggleWatched}
                  onSaved={refreshMovies}
                  onViewRewatch={(id) => {
                    setRewatchTarget(id);
                    setTab("rewatch");
                    window.scrollTo({ top: 0 });
                  }}
                  notify={notify}
                />
              )}
              {tab === "rewatch" && (
                <RewatchProtocol
                  movies={movies}
                  version={moviesVersion}
                  initialTarget={rewatchTarget}
                  pending={pending}
                  onToggleWatched={toggleWatched}
                />
              )}
              {tab === "booking" && (
                <CinemaBooking cinemas={cinemas} onCreated={refreshCinemas} notify={notify} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
      <Toasts toasts={toasts} />
    </MotionConfig>
  );
}
