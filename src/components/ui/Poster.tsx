"use client";

import Image from "next/image";
import { Film } from "lucide-react";
import { useState } from "react";
import { posterFor } from "@/lib/posters";

// 2:3 poster frame. Falls back to a plain title card if there is no artwork or it fails to load.
export default function Poster({ title, className = "", priority = false }: { title: string; className?: string; priority?: boolean }) {
  const src = posterFor(title);
  const [failed, setFailed] = useState(false);
  const frame = `relative aspect-[2/3] overflow-hidden rounded-sm border border-line bg-card ${className}`;

  if (!src || failed) {
    return (
      <div role="img" aria-label={`${title}, no poster available`} className={`${frame} flex flex-col items-center justify-center gap-2 p-2 text-center`}>
        <Film size={20} className="text-ash" aria-hidden />
        <span className="line-clamp-3 text-xs leading-snug text-ash">{title}</span>
      </div>
    );
  }

  return (
    <div className={frame}>
      <Image src={src} alt={`${title} poster`} fill priority={priority} unoptimized sizes="(min-width: 1024px) 270px, 45vw" className="object-cover" onError={() => setFailed(true)} />
    </div>
  );
}
