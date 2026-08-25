import { QuizContinentScope } from "@/lib/types";

type ContinentPieceIconProps = {
  scope: QuizContinentScope;
  className?: string;
};

function IconShell({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["h-3.5 w-3.5 shrink-0", className].join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function ContinentPieceIcon({ scope, className }: ContinentPieceIconProps) {
  switch (scope) {
    case QuizContinentScope.AFRICA:
      return (
        <IconShell className={className}>
          {/* North Africa Coast, Horn of Africa, East/South Coast, West Africa Bulge */}
          <path d="M7 6.5C8 5.5 12 5 15.5 6C16.5 7.5 18 9 19.5 9.5C18.5 11 17 13 16 14.5C15 16 13.5 19.5 12.5 20.5C11.5 19.5 10.5 16 10.5 14.5C9 14.5 6 13.5 5 11C4.5 9.5 5.5 8 7 6.5Z" />
          {/* Madagascar */}
          <path d="M18.5 15.5L17.5 18" />
        </IconShell>
      );
    case QuizContinentScope.AMERICAS:
      return (
        <IconShell className={className}>
          {/* North America */}
          <path d="M3.5 4.5C5 3.5 8.5 3 11 4C11.5 5.5 10 7.5 8.5 8.5C10 9.5 11.5 9.5 12 11C10.5 12 8.5 12 7.5 11C6.5 11.5 5.5 9 4.5 8.5C3.5 8 3 6 3.5 4.5Z" />
          {/* Central & South America */}
          <path d="M11 11.5L12 13C13 13.5 15 14.5 14 16.5C13 18.5 11.5 20.5 10.5 21C9.5 20 9.5 17.5 10 15.5C9.5 14.5 10 13 11 11.5Z" />
        </IconShell>
      );
    case QuizContinentScope.ASIA:
      return (
        <IconShell className={className}>
          {/* Main Asian Continent & Arabian Peninsula */}
          <path d="M3 10C3.5 8.5 6 6 9 5.5C12 5 16 4 20 5.5C21.5 7 21 9 19.5 10.5C20.5 12 19 13.5 17.5 13.5C16.5 15 15 16 14 17.5C13 16 12 14 11 13.5C9.5 14 8.5 15.5 7.5 15.5C7 14 6 13 4.5 12.5C3.5 12 2.5 11 3 10Z" />
          {/* Japan Arch */}
          <path d="M21.5 8.5C21 10 20.5 11 20 11.5" />
        </IconShell>
      );
    case QuizContinentScope.EUROPE:
      return (
        <IconShell className={className}>
          {/* Continental Europe, Scandinavia & Mediterranean */}
          <path d="M4 16C3.5 14 5 13 6 12C5.5 10 7 8 9.5 8C10.5 6 12 5 13.5 5.5C14 7 12.5 8.5 13 10C15 10 17 9.5 18 11C19 12 17.5 13.5 16.5 14C15.5 15 13 14 11.5 15.5C9.5 15 8 16.5 6.5 17C5 17.5 4 17 4 16Z" />
          {/* British Isles */}
          <path d="M6 7.5C6.5 6.5 7.5 6.5 8 7.5C7.5 8.5 6.5 9 6 7.5Z" />
        </IconShell>
      );
    case QuizContinentScope.OCEANIA:
      return (
        <IconShell className={className}>
          {/* Mainland Australia */}
          <path d="M5 11.5C6.5 10 10 9.5 12.5 10.5C13.5 11.5 14 13.5 13 15C11.5 16.5 8.5 16.5 6 15.5C4.5 14.5 4 12.5 5 11.5Z" />
          {/* Papua New Guinea */}
          <path d="M10 7.5C11.5 7 13.5 7.5 14 8.5C12.5 9 10.5 8.5 10 7.5Z" />
          {/* New Zealand Islands */}
          <path d="M16.5 16.5L17.5 18M18 14.5L19 16" />
        </IconShell>
      );
    default:
      return (
        <IconShell className={className}>
          <circle cx="12" cy="12" r="8" />
          <path d="M4 12h16" />
          <path d="M12 4a12 12 0 0 1 0 16" />
          <path d="M12 4a12 12 0 0 0 0 16" />
        </IconShell>
      );
  }
}