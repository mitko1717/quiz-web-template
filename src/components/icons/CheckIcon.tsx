type CheckIconProps = {
  className?: string;
};

export function CheckIcon({ className = "h-3.5 w-3.5" }: CheckIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M3.2 8.4 6.6 11.6 12.8 4.8" />
    </svg>
  );
}
