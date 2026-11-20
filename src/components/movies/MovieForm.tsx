"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { PrimaryButton, GhostButton, Spinner } from "@/components/ui/Panels";
import { ApiRequestError, api, errorMessage, jsonBody } from "@/lib/client";
import type { Movie } from "@/lib/types";

type FieldErrors = Partial<Record<"title" | "releaseYear" | "runtime", string>>;

const inputClass = "field mt-1.5";

// Creates a movie (no `movie` prop) or edits one. On edit only changed fields are sent,
// so `watched` and anything else the user did not touch is never overwritten.
export default function MovieForm({
  movie,
  movies,
  onClose,
  onSaved,
  notify,
}: {
  movie?: Movie;
  movies: Movie[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  notify: (tone: "success" | "error", text: string) => void;
}) {
  const [title, setTitle] = useState(movie?.title ?? "");
  const [year, setYear] = useState(movie ? String(movie.releaseYear) : "");
  const [runtime, setRuntime] = useState(movie ? String(movie.runtime) : "");
  const [prereqs, setPrereqs] = useState<number[]>(movie?.prerequisites.map((p) => p.id) ?? []);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const choices = movies.filter((m) => m.id !== movie?.id);

  function validate(): { title: string; releaseYear: number; runtime: number } | null {
    const next: FieldErrors = {};
    const y = Number(year);
    const r = Number(runtime);
    if (!title.trim()) next.title = "Enter a title.";
    if (!year.trim() || !Number.isInteger(y) || y < 1888 || y > 2100) next.releaseYear = "Enter a year between 1888 and 2100.";
    if (!runtime.trim() || !Number.isInteger(r) || r < 1 || r > 300) next.runtime = "Enter a runtime between 1 and 300 minutes.";
    setErrors(next);
    return Object.keys(next).length ? null : { title: title.trim(), releaseYear: y, runtime: r };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const values = validate();
    if (!values) return;

    let payload: Record<string, unknown> = { ...values, prerequisites: prereqs };
    if (movie) {
      const before = new Set(movie.prerequisites.map((p) => p.id));
      const prereqChanged = before.size !== prereqs.length || prereqs.some((id) => !before.has(id));
      payload = {};
      if (values.title !== movie.title) payload.title = values.title;
      if (values.releaseYear !== movie.releaseYear) payload.releaseYear = values.releaseYear;
      if (values.runtime !== movie.runtime) payload.runtime = values.runtime;
      if (prereqChanged) payload.prerequisites = prereqs;
      if (Object.keys(payload).length === 0) return onClose();
    }

    setSaving(true);
    try {
      await api(movie ? `/api/movies/${movie.id}` : "/api/movies", jsonBody(movie ? "PATCH" : "POST", payload));
    } catch (err) {
      setSaving(false);
      if (err instanceof ApiRequestError && err.code === "DUPLICATE_TITLE") {
        setErrors({ title: "A movie with this title already exists." });
      } else if (err instanceof ApiRequestError && err.code === "CIRCULAR_DEPENDENCY") {
        setFormError(
          "That would create a loop. One of the selected prerequisites already requires this movie, directly or through other films. Remove it and save again.",
        );
      } else {
        setFormError(errorMessage(err));
      }
      return; // keep the form open so nothing typed is lost
    }

    try {
      await onSaved();
      notify("success", movie ? `${values.title} updated.` : `${values.title} added.`);
    } catch (err) {
      notify("error", `Saved, but the list could not refresh: ${errorMessage(err)}`);
    }
    onClose();
  }

  function togglePrereq(id: number) {
    setPrereqs((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  }

  return (
    <Modal title={movie ? "Edit movie" : "Add movie"} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <div>
          <label htmlFor="mf-title" className="text-sm font-medium">Title</label>
          <input id="mf-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!errors.title} aria-describedby={errors.title ? "mf-title-err" : undefined} />
          {errors.title && <p id="mf-title-err" className="mt-1.5 text-sm text-accent-text">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="mf-year" className="text-sm font-medium">Release year</label>
            <input id="mf-year" inputMode="numeric" className={inputClass} value={year} onChange={(e) => setYear(e.target.value)}
              aria-invalid={!!errors.releaseYear} aria-describedby={errors.releaseYear ? "mf-year-err" : undefined} />
            {errors.releaseYear && <p id="mf-year-err" className="mt-1.5 text-sm text-accent-text">{errors.releaseYear}</p>}
          </div>
          <div>
            <label htmlFor="mf-runtime" className="text-sm font-medium">Runtime (min)</label>
            <input id="mf-runtime" inputMode="numeric" className={inputClass} value={runtime} onChange={(e) => setRuntime(e.target.value)}
              aria-invalid={!!errors.runtime} aria-describedby={errors.runtime ? "mf-runtime-err" : undefined} />
            {errors.runtime && <p id="mf-runtime-err" className="mt-1.5 text-sm text-accent-text">{errors.runtime}</p>}
          </div>
        </div>

        <fieldset>
          <legend className="flex w-full items-center justify-between text-sm font-medium">
            <span>Prerequisites (optional)</span>
            {prereqs.length > 0 && (
              <button type="button" onClick={() => setPrereqs([])} className="text-accent-text underline-offset-2 hover:underline">
                Clear {prereqs.length}
              </button>
            )}
          </legend>
          <div className="mt-2 max-h-48 overflow-y-auto border border-line-strong bg-card">
            {choices.length === 0 && <p className="p-4 text-sm text-ash">No other movies yet.</p>}
            {choices.map((m) => (
              <label key={m.id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface">
                <input type="checkbox" checked={prereqs.includes(m.id)} onChange={() => togglePrereq(m.id)} className="size-4 accent-[#f40006]" />
                <span className="flex-1">{m.title}</span>
                <span className="tnum text-sm text-ash">{m.releaseYear}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {formError && (
          <p role="alert" className="border border-accent bg-card p-3 text-sm">
            {formError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton type="submit" disabled={saving}>
            {saving && <Spinner />}
            {saving ? "Saving" : movie ? "Save changes" : "Add movie"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
