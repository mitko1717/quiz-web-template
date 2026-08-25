type RefreshIconProps = {
  className?: string;
  spinning?: boolean;
};

export function RefreshIcon({ className = "block h-5 w-5 shrink-0", spinning = false }: RefreshIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={[
        className,
        spinning ? "animate-spin" : ""
      ].join(" ")}
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  );
}
