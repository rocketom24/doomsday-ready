import { Film } from "lucide-react";
import Poster from "@/components/ui/Poster";

export default function Hero() {
  return (
    <header className="border-t-[6px] border-t-accent border-b border-wine bg-oxblood">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 pt-6 pb-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end md:gap-16 md:pt-8 md:pb-12">
        <div>
          <p className="font-display flex items-center gap-2 text-base font-bold tracking-[0.18em] uppercase">
            <Film size={18} aria-hidden className="text-accent" />
            Doomsday Ready
          </p>
          <span className="slab mt-10 md:mt-16" aria-hidden />
          <h1 className="mt-5 max-w-3xl text-[clamp(3.25rem,9vw,7rem)] leading-[0.95] font-extrabold">
            The road to Doomsday
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ash">
            Track the MCU timeline, finish the films you still need to rewatch, and work out how to book seats for
            your whole group.
          </p>
        </div>

        <figure className="flex items-end gap-4 md:flex-col md:items-start md:gap-3">
          <Poster title="Avengers: Doomsday" priority className="w-24 md:w-40" />
          <figcaption className="text-sm">
            <span className="font-display block tracking-[0.14em] text-accent-text uppercase">Target film</span>
            <span className="font-medium">Avengers: Doomsday</span>
          </figcaption>
        </figure>
      </div>
    </header>
  );
}
