"use client";

import { motion } from "motion/react";
import { Film } from "lucide-react";
import HeroDoodles from "./HeroDoodles";
import Poster from "@/components/ui/Poster";

export default function Hero() {
  return (
    <header
      className="relative overflow-hidden bg-blood pb-16 md:pb-24"
      // angled bottom edge, the black page shows through the cut
      style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 36px), 0 100%)" }}
    >
      <HeroDoodles />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pt-8 sm:px-8 md:grid-cols-[1fr_auto] md:items-center md:gap-16 md:pt-12">
        <div>
          <motion.p initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.05 }} className="font-display inline-flex items-center gap-2 bg-black px-3 py-1.5 text-sm font-bold tracking-[0.2em] text-white uppercase">
            <Film size={15} aria-hidden className="text-accent" />
            Doomsday Ready
          </motion.p>

          <h1 className="mt-8 md:mt-12">
            <motion.span initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} className="font-display block text-[clamp(1.5rem,3.6vw,2.75rem)] leading-none font-bold tracking-[0.3em] text-black">
              The road to
            </motion.span>
            <span className="sr-only">Doomsday</span>
            <motion.span
              aria-hidden
              initial={{ opacity: 0, x: -48 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
              className="font-display mt-3 flex items-end text-[clamp(4rem,13vw,10rem)] leading-[0.85] font-extrabold text-white uppercase"
            >
              {/* The D is drawn like the Avengers "A": hard angular body with a crossbar that
                  runs through it and sticks out to the left. */}
              <svg viewBox="-18 0 130 120" className="ml-[0.14em] mr-[0.04em] h-[1.15em] w-auto shrink-0 overflow-visible">
                <path
                  fill="#fff"
                  fillRule="evenodd"
                  d="M8 0H62L100 38V82L62 120H8ZM32 24V96H54L72 78V42L54 24Z"
                />
                <motion.g
                  style={{ transformBox: "fill-box", transformOrigin: "100% 50%" }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
                >
                  <rect x="-16" y="54" width="122" height="13" fill="#fff" stroke="var(--color-blood)" strokeWidth="4" />
                  <polygon points="-16,54 -28,60.5 -16,67" fill="#fff" />
                </motion.g>
              </svg>
              <span>oomsday</span>
            </motion.span>
          </h1>

          <motion.p initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.55 }} className="mt-8 max-w-lg border-l-4 border-black pl-5 text-lg leading-relaxed text-white">
            Track the MCU timeline, finish the films you still need to rewatch, and work out how to book seats for
            your whole group.
          </motion.p>
        </div>

        <motion.figure
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="flex items-end gap-5 md:flex-col md:items-start md:gap-4">
          <motion.div
            whileHover={{ x: -4, y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="shadow-[10px_10px_0_0_#000] transition-shadow duration-300 hover:shadow-[16px_16px_0_0_#000] md:shadow-[14px_14px_0_0_#000] md:hover:shadow-[20px_20px_0_0_#000]"
          >
            <Poster title="Avengers: Doomsday" priority className="w-32 border-2 border-white sm:w-44 md:w-72" />
          </motion.div>
          <figcaption className="text-sm md:mt-3">
            <span className="font-display block tracking-[0.2em] text-black uppercase">Target film</span>
            <span className="font-display text-2xl font-bold tracking-wide text-white uppercase">Avengers: Doomsday</span>
          </figcaption>
        </motion.figure>
      </div>
    </header>
  );
}
