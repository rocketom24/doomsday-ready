"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type Option = { value: number; label: string; hint?: string };

// Custom dropdown (listbox pattern) so open/close can be animated.
export default function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: number | null;
  onChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function choose(v: number) {
    onChange(v);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") return setOpen(false);
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    if (!open) return setOpen(true);
    const items = Array.from(root.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    const at = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? Math.min(at + 1, items.length - 1) : Math.max(at - 1, 0);
    items[next]?.focus();
  }

  return (
    <div ref={root} className="relative" onKeyDown={onKeyDown}>
      <span id={id} className="text-sm font-medium">
        {label}
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={id}
        onClick={() => setOpen((o) => !o)}
        className="field mt-1.5 flex items-center justify-between gap-4 text-left hover:border-ash"
      >
        <span className="truncate">{current?.label ?? "Select a movie"}</span>
        <ChevronDown size={16} aria-hidden className={`shrink-0 text-ash transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-labelledby={id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded border border-line-strong bg-surface py-1"
          >
            {options.map((o) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                tabIndex={-1}
                onClick={() => choose(o.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    choose(o.value);
                  }
                }}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 outline-none transition-colors hover:bg-card focus:bg-card"
              >
                <span className="grid size-4 shrink-0 place-items-center">
                  {o.value === value && <Check size={14} aria-hidden />}
                </span>
                <span className="flex-1">{o.label}</span>
                {o.hint && <span className="tnum text-sm text-ash">{o.hint}</span>}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
