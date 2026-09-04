import type { ComponentPropsWithoutRef, ReactNode } from "react";

interface SectionLabelProps extends ComponentPropsWithoutRef<"p"> {
  children: string;
}

export function SectionLabel({ children, className = "", ...props }: SectionLabelProps) {
  return (
    <p className={["text-xs font-medium uppercase tracking-[0.14em] text-ink-500", className].join(" ").trim()} {...props}>
      {children}
    </p>
  );
}

interface BodyTextProps extends ComponentPropsWithoutRef<"p"> {
  children: ReactNode;
}

export function BodyText({ children, className = "", ...props }: BodyTextProps) {
  return (
    <p className={["mt-2 text-sm text-ink-300", className].join(" ").trim()} {...props}>
      {children}
    </p>
  );
}
