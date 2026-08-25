import type { ComponentPropsWithoutRef } from "react";

interface InputProps extends ComponentPropsWithoutRef<"input"> {
  label?: string;
}

export function Input({ label, id, className = "", ...props }: InputProps) {
  const inputEl = (
    <input
      id={id}
      className={[
        "w-full rounded-xl border border-base-600 bg-base-800 px-3 py-2.5 text-ink-100 outline-none transition-colors focus:border-accent-greenDim",
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
