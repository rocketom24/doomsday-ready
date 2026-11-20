"use client";

import { motion } from "motion/react";

export type Tab = "movies" | "rewatch" | "booking";

const items: { id: Tab; label: string }[] = [
  { id: "movies", label: "Movie database" },
  { id: "rewatch", label: "Rewatch protocol" },
  { id: "booking", label: "Cinema booking" },
];

export default function Nav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav aria-label="Sections" className="sticky top-0 z-40 border-b border-wine bg-oxblood">
      <div className="mx-auto grid max-w-6xl grid-cols-3 px-2 sm:flex sm:gap-2 sm:px-8">
        {items.map((item) => {
          const active = item.id === tab;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.95 }}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onChange(item.id)}
              className={`relative px-1 py-3.5 text-center font-display text-[0.9rem] font-semibold tracking-[0.1em] uppercase transition-colors duration-150 sm:px-5 sm:text-base ${
                active ? "text-bone" : "text-ash hover:text-bone"
              }`}
            >
              {item.label}
              {active && (
                <motion.span
                  layoutId="nav-indicator"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute inset-x-0 bottom-0 h-[4px] bg-accent"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
