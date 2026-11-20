"use client";

// Hand-drawn style line doodles of Avengers icons for the hero background.
// Pure decoration: black strokes at low opacity, aria-hidden, no interaction.
import { motion } from "motion/react";
import type { ReactNode } from "react";

function star(cx: number, cy: number, outer: number, inner: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((-90 + i * 36) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

const doodles: { name: string; art: ReactNode }[] = [
  {
    name: "shield",
    art: (
      <>
        <circle cx="50" cy="50" r="44" />
        <circle cx="50" cy="50" r="34" />
        <circle cx="50" cy="50" r="24" />
        <polygon points={star(50, 50, 20, 8)} />
      </>
    ),
  },
  {
    name: "hammer",
    art: (
      <>
        <rect x="18" y="20" width="64" height="26" />
        <path d="M30 28v10M42 28v10M58 28v10M70 28v10" />
        <rect x="44" y="46" width="12" height="42" />
        <path d="M44 60h12M44 68h12M44 76h12" />
        <path d="M50 88v6" />
        <circle cx="50" cy="97" r="2.5" />
      </>
    ),
  },
  {
    name: "arc reactor",
    art: (
      <>
        <circle cx="50" cy="50" r="44" />
        <circle cx="50" cy="50" r="30" />
        <circle cx="50" cy="50" r="12" />
        <path d="M50 6v14M50 80v14M6 50h14M80 50h14M19 19l10 10M71 71l10 10M81 19L71 29M29 71L19 81" />
      </>
    ),
  },
  {
    name: "iron man helmet",
    art: (
      <>
        <path d="M28 18Q50 6 72 18L76 52Q72 74 50 92Q28 74 24 52Z" />
        <path d="M50 12v26" />
        <path d="M32 44l14 4-2 6-13-3zM68 44L54 48l2 6 13-3z" />
        <path d="M40 72h20M44 80h12" />
      </>
    ),
  },
  {
    name: "bow and arrow",
    art: (
      <>
        <path d="M34 8Q88 50 34 92" />
        <path d="M34 8v84" />
        <path d="M8 50h82" />
        <polygon points="90,50 80,44 80,56" />
        <path d="M8 50l-4-6M8 50l-4 6M16 50l-4-6M16 50l-4 6" />
      </>
    ),
  },
  {
    name: "lightning",
    art: (
      <>
        <polygon points="58,4 22,56 46,56 38,96 78,38 52,38" />
        <path d="M14 20l8 6M8 44l9 2M82 70l8 6M86 54l8-2" />
      </>
    ),
  },
  {
    name: "infinity stones",
    art: (
      <>
        <circle cx="50" cy="50" r="40" />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = ((i * 60 - 90) * Math.PI) / 180;
          const x = 50 + 26 * Math.cos(a);
          const y = 50 + 26 * Math.sin(a);
          return <polygon key={i} points={`${x},${y - 8} ${x + 6},${y} ${x},${y + 8} ${x - 6},${y}`} />;
        })}
        <circle cx="50" cy="50" r="5" />
      </>
    ),
  },
  {
    name: "fist",
    art: (
      <>
        <path d="M24 44V30a6 6 0 0 1 12 0v6a6 6 0 0 1 12 0v2a6 6 0 0 1 12 0v2a6 6 0 0 1 12 0v22Q72 84 52 84H44Q24 84 24 64Z" />
        <path d="M36 44v8M48 44v8M60 44v8" />
        <path d="M30 90h40" />
      </>
    ),
  },
];

// x/y in %, size in rem, rotation in degrees; spread so the text column stays readable.
const placement = [
  { i: 0, x: 62, y: 6, size: 9, rot: -12 },
  { i: 1, x: 40, y: 68, size: 8, rot: 18 },
  { i: 2, x: 2, y: 66, size: 7, rot: 0 },
  { i: 3, x: 54, y: 52, size: 8, rot: 10 },
  { i: 4, x: 30, y: 4, size: 7, rot: -20 },
  { i: 5, x: 91, y: 70, size: 6, rot: 14 },
  { i: 6, x: 52, y: 30, size: 6, rot: 0 },
  { i: 7, x: 12, y: 6, size: 5, rot: -8 },
];

export default function HeroDoodles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden text-black/25 select-none">
      {placement.map((p) => (
        <motion.svg
          key={doodles[p.i].name}
          initial={{ opacity: 0, scale: 0.6, rotate: p.rot - 25 }}
          animate={{ opacity: 1, scale: 1, rotate: p.rot, y: [0, -10, 0] }}
          transition={{
            opacity: { duration: 0.8, delay: 0.4 + p.i * 0.1 },
            scale: { duration: 0.8, delay: 0.4 + p.i * 0.1 },
            rotate: { duration: 0.9, delay: 0.4 + p.i * 0.1 },
            y: { duration: 5 + (p.i % 4), repeat: Infinity, ease: "easeInOut", delay: p.i * 0.4 },
          }}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute hidden sm:block"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}rem`, height: `${p.size}rem` }}
        >
          {doodles[p.i].art}
        </motion.svg>
      ))}
      {/* phones: fewer, smaller doodles so the text stays clear */}
      {[0, 3, 5].map((k) => (
        <svg
          key={`m-${k}`}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute size-20 sm:hidden"
          style={{ right: `${k === 0 ? -1 : k === 3 ? 18 : 2}rem`, top: `${k === 0 ? 1 : k === 3 ? 20 : 11}rem`, transform: `rotate(${k * 9 - 12}deg)` }}
        >
          {doodles[k].art}
        </svg>
      ))}
    </div>
  );
}
