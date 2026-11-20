import { Film } from "lucide-react";
import Poster from "@/components/ui/Poster";

export default function Hero() {
  return (
    <header className="border-b border-wine bg-oxblood">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 pt-6 pb-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end md:gap-16 md:pt-8 md:pb-12">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Film size={16} aria-hidden />
            Doomsday Ready
          </p>
          <h1 className="mt-10 max-w-3xl text-[clamp(2.75rem,7.5vw,5.5rem)] leading-[1.02] font-semibold tracking-[-0.035em] md:mt-16">
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
            <span className="block text-ash">Target film</span>
            <span className="font-medium">Avengers: Doomsday</span>
          </figcaption>
        </figure>
      </div>
    </header>
  );
}
