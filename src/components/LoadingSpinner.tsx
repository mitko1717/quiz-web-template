"use client";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeClass = size === "sm" ? "h-4 w-4 border-2" : size === "lg" ? "h-10 w-10 border-[3px]" : "h-6 w-6 border-2";

  return (
    <span
      aria-hidden="true"
      className={["inline-block animate-spin rounded-full border-base-500 border-t-accent-green", sizeClass, className].join(" ")}
    />
  );
}
