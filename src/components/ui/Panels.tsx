"use client";

import { CircleAlert } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function SectionHeading({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="slab mb-3" aria-hidden />
        <h2 className="text-4xl sm:text-5xl">{title}</h2>
        <p className="mt-2 max-w-xl text-ash">{text}</p>
      </div>
      {action}
    </div>
  );
}

// Compact inline figures separated by hairlines, not tiles.
export function StatRow({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-y-5 border-y-2 border-wine py-5 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="pr-4 sm:pl-6 sm:first:pl-0 sm:[&:not(:first-child)]:border-l sm:border-wine">
          <dt className="font-display text-sm font-semibold tracking-[0.12em] text-ash uppercase">{item.label}</dt>
          <dd className="font-display tnum mt-0.5 text-4xl font-bold">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className = "", ...props }: ButtonProps) {
  return <button {...props} className={`btn btn-primary ${className}`} />;
}

export function GhostButton({ className = "", ...props }: ButtonProps) {
  return <button {...props} className={`btn btn-secondary ${className}`} />;
}

export function Spinner() {
  return (
    <span aria-hidden className="inline-block size-4 animate-spin rounded-full border-2 border-bone/30 border-t-bone" />
  );
}

export function LoadingBlock({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded border border-line bg-surface py-20 text-ash" role="status">
      <Spinner />
      {text}
    </div>
  );
}

export function ErrorBlock({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="rounded border border-line-strong border-l-accent bg-surface p-5 [border-left-width:3px]" role="alert">
      <p className="flex items-center gap-2 font-medium">
        <CircleAlert size={16} className="text-accent-text" aria-hidden />
        Request failed
      </p>
      <p className="mt-1 text-ash">{text}</p>
      {onRetry && (
        <GhostButton type="button" onClick={onRetry} className="mt-4">
          Try again
        </GhostButton>
      )}
    </div>
  );
}

export function EmptyBlock({ children }: { children: ReactNode }) {
  return <p className="rounded border border-line bg-surface p-10 text-center text-ash">{children}</p>;
}
