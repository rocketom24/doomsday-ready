"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, CircleAlert, Plus, Ticket, Users } from "lucide-react";
import { useRef, useState } from "react";
import { EmptyBlock, GhostButton, PrimaryButton, SectionHeading, Spinner, StatRow } from "@/components/ui/Panels";
import { api, errorMessage } from "@/lib/client";
import type { BookingResult, Cinema } from "@/lib/types";
import CinemaForm from "./CinemaForm";

export default function CinemaBooking({
  cinemas,
  onCreated,
  notify,
}: {
  cinemas: Cinema[];
  onCreated: () => Promise<void>;
  notify: (tone: "success" | "error", text: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(cinemas[0]?.id ?? null);
  const [groupSize, setGroupSize] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const latest = useRef(0);

  const selected = cinemas.find((c) => c.id === selectedId) ?? null;

  function choose(id: number) {
    if (id === selectedId) return;
    latest.current++; // ignore any in-flight answer for the old cinema
    setSelectedId(id);
    setResult(null);
    setApiError(null);
    setLoading(false);
  }

  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const n = Number(groupSize);
    if (!groupSize.trim() || !Number.isInteger(n) || n < 1 || n > 10000) {
      setInputError("Enter a whole number from 1 to 10,000.");
      setResult(null); // don't leave a previous quote showing beside the error
      setApiError(null);
      return;
    }
    setInputError(null);
    setApiError(null);
    setLoading(true);
    const ticket = ++latest.current;
    try {
      const data = await api<BookingResult>(`/api/cinemas/${selected.id}/booking?groupSize=${n}`);
      if (ticket !== latest.current) return;
      setResult(data);
    } catch (err) {
      if (ticket !== latest.current) return;
      setResult(null);
      setApiError(errorMessage(err));
    } finally {
      if (ticket === latest.current) setLoading(false);
    }
  }

  return (
    <section aria-labelledby="booking-h">
      <SectionHeading
        title="Cinema booking"
        text="Cinemas sell seats in fixed bundles. Enter your group size to get the fewest bundles that fill it exactly."
        action={
          <GhostButton type="button" onClick={() => setAdding(true)}>
            <Plus size={16} aria-hidden />
            Add cinema
          </GhostButton>
        }
      />

      {cinemas.length === 0 ? (
        <div className="mt-8">
          <EmptyBlock>No cinemas yet. Use Add cinema to create one.</EmptyBlock>
        </div>
      ) : (
        <>
          <ul role="radiogroup" aria-label="Cinema" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cinemas.map((c) => {
              const on = c.id === selectedId;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => choose(c.id)}
                    className={`relative block h-full w-full rounded border p-4 text-left transition-colors duration-150 ${
                      on ? "border-accent bg-wine" : "border-line bg-surface hover:border-line-strong hover:bg-card"
                    }`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-display text-xl leading-tight font-bold tracking-wide uppercase">{c.name}</span>
                      {on && <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-bone" />}
                    </span>
                    <span className="mt-3 block text-sm text-ash">Bundles of</span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5" aria-label={`Bundle sizes: ${c.bundleSizes.join(", ")}`}>
                      {c.bundleSizes.map((s) => (
                        <span key={s} className="tnum rounded-sm border border-line-strong px-2 py-0.5 text-sm">
                          {s}
                        </span>
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <form onSubmit={calculate} noValidate className="mt-6 rounded border border-line bg-surface p-5 sm:p-6">
            <label htmlFor="group-size" className="text-sm font-medium">
              Group size{selected ? ` at ${selected.name}` : ""}
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Users size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ash" />
                <input
                  id="group-size"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={10000}
                  value={groupSize}
                  onChange={(e) => setGroupSize(e.target.value)}
                  placeholder="Number of people"
                  aria-invalid={!!inputError}
                  aria-describedby="group-size-hint"
                  className="field tnum py-3 pl-11 text-lg"
                />
              </div>
              <PrimaryButton type="submit" disabled={loading || !selected} className="px-6 py-3 sm:min-w-48">
                {loading ? <Spinner /> : <Ticket size={16} aria-hidden />}
                {loading ? "Calculating" : "Calculate bundles"}
              </PrimaryButton>
            </div>
            <p id="group-size-hint" className={`mt-2 text-sm ${inputError ? "text-accent-text" : "text-ash"}`}>
              {inputError ?? "A whole number from 1 to 10,000."}
            </p>
          </form>

          <div className="mt-6" aria-live="polite" data-booking-result>
            {apiError && (
              <p role="alert" className="rounded border border-accent bg-card p-4 text-sm">
                {apiError}
              </p>
            )}
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  key={`${result.cinema.id}-${result.groupSize}-${result.possible}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {result.possible ? <Possible result={result} /> : <Impossible result={result} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      <AnimatePresence>
        {adding && (
          <CinemaForm
            onClose={() => setAdding(false)}
            onCreated={async (created) => {
              await onCreated();
              setSelectedId(created.id);
              setResult(null);
            }}
            notify={notify}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function Possible({ result }: { result: BookingResult }) {
  const seats = result.totalSeats ?? 0;
  const bundles = result.totalBundles ?? 0;

  return (
    <div className="rounded border border-wine bg-oxblood p-5 sm:p-6">
      <p className="text-sm text-ash">Exact booking available at {result.cinema.name}</p>

      <div className="mt-4 grid gap-8 md:grid-cols-[auto_1fr] md:gap-14">
        <div>
          <p className="font-display tnum text-8xl leading-none font-bold text-accent sm:text-9xl">{bundles}</p>
          <p className="mt-2 text-ash">{bundles === 1 ? "bundle" : "bundles"}, the minimum</p>
        </div>

        <ul aria-label="Bundle breakdown" className="divide-y divide-line self-end border-y border-line">
          {result.bundles.map((b) => (
            <li key={b.size} className="py-3">
              <div className="flex items-baseline justify-between gap-4">
                <p>
                  <span className="tnum text-xl font-semibold">{b.count}</span>
                  <span className="text-ash"> × </span>
                  <span className="tnum">{b.size}-seat bundle</span>
                </p>
                <p className="tnum text-sm text-ash">{b.size * b.count} seats</p>
              </div>
              <div className="mt-2 h-1 rounded-sm bg-line">
                <div className="h-full rounded-sm bg-accent" style={{ width: `${(b.size * b.count * 100) / result.groupSize}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <StatRow
          items={[
            { label: "Group size", value: result.groupSize.toLocaleString() },
            { label: "Seats booked", value: seats.toLocaleString() },
            { label: "Extra seats", value: (seats - result.groupSize).toLocaleString() },
            { label: "Bundle types", value: result.bundles.length },
          ]}
        />
      </div>
    </div>
  );
}

function Impossible({ result }: { result: BookingResult }) {
  return (
    <div className="rounded border border-wine bg-oxblood p-5 [border-left-width:3px] border-l-accent sm:p-6">
      <p className="flex items-center gap-2 font-semibold">
        <CircleAlert size={18} aria-hidden className="text-accent-text" />
        Exact booking unavailable
      </p>
      <p className="mt-3 max-w-xl text-ash">
        {result.cinema.name} sells bundles of {result.cinema.bundleSizes.join(", ")} seats, and no combination of
        them adds up to {result.groupSize.toLocaleString()}. Try a different group size or pick another cinema.
      </p>
    </div>
  );
}
