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
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onChange(item.id)}
              className={`relative px-1 py-3.5 text-center text-[0.8125rem] font-medium transition-colors duration-150 sm:px-4 sm:text-sm ${
                active ? "text-bone" : "text-ash hover:text-bone"
              }`}
            >
              {item.label}
              {active && (
                <motion.span
                  layoutId="nav-indicator"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute inset-x-0 bottom-0 h-[3px] bg-accent"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
