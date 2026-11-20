"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, CircleAlert } from "lucide-react";

export type ToastData = { id: number; tone: "success" | "error"; text: string };

export default function Toasts({ toasts }: { toasts: ToastData[] }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex max-w-sm items-start gap-3 rounded border border-line-strong bg-card px-4 py-3 text-sm"
          >
            {t.tone === "success" ? (
              <Check size={16} className="mt-0.5 shrink-0 text-bone" aria-hidden />
            ) : (
              <CircleAlert size={16} className="mt-0.5 shrink-0 text-accent-text" aria-hidden />
            )}
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
