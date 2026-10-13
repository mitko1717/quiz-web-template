import type { ComponentPropsWithoutRef } from "react";

interface InputProps extends ComponentPropsWithoutRef<"input"> {
  label?: string;
}

export function Input({ label, id, className = "", ...props }: InputProps) {
  const inputEl = (
    <input
      id={id}
      className={[
        "w-full rounded-xl bg-base-900/50 px-3 py-2 text-ink-100 outline-none ring-1 ring-inset ring-base-600/50 transition-shadow placeholder:text-ink-500 focus:ring-accent-green/60",
        className,
      ].join(" ").trim()}
      {...props}
    />
  );

  if (!label) return inputEl;

  return (
    <label className="grid gap-1 text-sm text-ink-300" htmlFor={id}>
      <span>{label}</span>
      {inputEl}
    </label>
  );
}
