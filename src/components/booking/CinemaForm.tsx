"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { GhostButton, PrimaryButton, Spinner } from "@/components/ui/Panels";
import { ApiRequestError, api, errorMessage, jsonBody } from "@/lib/client";
import type { Cinema } from "@/lib/types";

const inputClass = "field mt-1.5";

export default function CinemaForm({
  onClose,
  onCreated,
  notify,
}: {
  onClose: () => void;
  onCreated: (cinema: Cinema) => Promise<void>;
  notify: (tone: "success" | "error", text: string) => void;
}) {
  const [name, setName] = useState("");
  const [sizes, setSizes] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [sizesError, setSizesError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parts = sizes.split(/[,\s]+/).filter(Boolean);
    const numbers = parts.map(Number);
    let sErr: string | null = null;
    if (parts.length === 0) sErr = "Enter at least one bundle size.";
    else if (numbers.some((n) => !Number.isInteger(n) || n < 1 || n > 500)) sErr = "Use whole numbers from 1 to 500, separated by commas.";
    else if (new Set(numbers).size !== numbers.length) sErr = "Each bundle size can only appear once.";
    else if (numbers.length > 10) sErr = "Use at most 10 bundle sizes.";
    const nErr = name.trim() ? null : "Enter a cinema name.";
    setNameError(nErr);
    setSizesError(sErr);
    if (nErr || sErr) return;

    setSaving(true);
    let created: Cinema;
    try {
      created = await api<Cinema>("/api/cinemas", jsonBody("POST", { name: name.trim(), bundleSizes: numbers }));
    } catch (err) {
      setSaving(false);
      if (err instanceof ApiRequestError && err.code === "DUPLICATE_CINEMA") setNameError("A cinema with this name already exists.");
      else setFormError(errorMessage(err));
      return;
    }
    try {
      await onCreated(created);
      notify("success", `${created.name} added.`);
    } catch (err) {
      notify("error", `Saved, but the list could not refresh: ${errorMessage(err)}`);
    }
    onClose();
  }

  return (
    <Modal title="Add cinema" onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <div>
          <label htmlFor="cf-name" className="text-sm font-medium">Cinema name</label>
          <input id="cf-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!nameError} />
          {nameError && <p className="mt-1.5 text-sm text-accent-text">{nameError}</p>}
        </div>
        <div>
          <label htmlFor="cf-sizes" className="text-sm font-medium">Bundle sizes</label>
          <input id="cf-sizes" className={inputClass} value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="e.g. 2, 5, 8" aria-invalid={!!sizesError} />
          {sizesError ? (
            <p className="mt-1.5 text-sm text-accent-text">{sizesError}</p>
          ) : (
            <p className="mt-1.5 text-sm text-ash">Seats per bundle, separated by commas.</p>
          )}
        </div>
        {formError && <p role="alert" className="border border-accent bg-card p-3 text-sm">{formError}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton type="submit" disabled={saving}>
            {saving && <Spinner />}
            {saving ? "Saving" : "Add cinema"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
