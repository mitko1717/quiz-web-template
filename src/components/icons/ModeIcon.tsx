type ModeIconProps = {
  className?: string;
};

export function ModeIcon({ className = "h-4 w-4" }: ModeIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 17h16" />
      <path d="M9 7a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z" />
      <path d="M19 17a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z" />
    </svg>
  );
}
