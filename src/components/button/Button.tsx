import type { ButtonHTMLAttributes, ReactNode } from "react";

const VARIANT_CLASSES = {
  primary: "bg-accent-green text-base-900 hover:bg-pastel-mint disabled:bg-accent-green/40",
  secondary: "border border-accent-greenDim text-ink-300 hover:border-accent-green hover:text-ink-100 disabled:opacity-40",
  ghost: "border border-base-600 bg-base-700/40 text-ink-300 hover:bg-base-700 hover:text-ink-100 disabled:opacity-40",
  suggestionAccent: "border border-accent-greenDim/70 bg-accent-green/15 text-accent-green hover:bg-accent-green/25 disabled:opacity-40",
  suggestionNeutral: "border border-base-600 bg-base-700/45 text-ink-300 hover:text-ink-100 disabled:opacity-40",
  adminRowActive: "border border-accent-greenDim bg-accent-green/10 text-ink-100 disabled:opacity-40",
  adminRowIdle: "border border-base-600 bg-base-700/35 text-ink-100 hover:border-accent-greenDim hover:bg-base-700/55 disabled:opacity-40",
  answerIdle: "border border-base-600 bg-base-700/70 text-ink-100 hover:border-accent-greenDim hover:bg-base-700 disabled:opacity-40",
  answerLocked: "border border-base-600 bg-base-700/40 text-ink-300 disabled:opacity-40",
  answerSelected: "border border-accent-green bg-accent-green/15 text-accent-green disabled:opacity-40",
  answerCorrect: "border border-pastel-mint/85 bg-gradient-to-r from-pastel-mint/45 via-pastel-mint/32 to-pastel-sky/28 text-base-900 font-extrabold shadow-[0_0_0_1px_rgba(168,230,176,0.55),0_6px_16px_rgba(168,230,176,0.22)] disabled:opacity-100",
  answerWrong: "border border-pastel-coral/60 bg-pastel-coral/15 text-pastel-coral disabled:opacity-40",
  answerTriedWrong: "border border-pastel-coral/35 bg-pastel-coral/10 text-pastel-coral/90 disabled:opacity-40",
  dailyOptionIdle: "border border-base-600 bg-base-700/35 text-ink-200 hover:border-accent-greenDim hover:bg-base-700/50 disabled:opacity-40",
  dailyOptionSelected: "border border-accent-greenDim bg-accent-green/10 text-ink-100 disabled:opacity-40",
  difficultyActive: "border border-accent-green bg-accent-green/20 text-accent-green disabled:opacity-40",
  difficultyOpen: "border border-base-600 bg-base-700/70 text-ink-300 hover:border-accent-greenDim hover:text-ink-100 disabled:opacity-40",
  difficultyLocked: "border border-base-600 bg-base-700/30 text-ink-500 disabled:opacity-40",
  inputModeActive: "border border-accent-greenDim bg-accent-green/15 text-accent-green disabled:opacity-40",
  inputModeIdle: "border border-base-600 bg-base-700/40 text-ink-300 hover:text-ink-100 disabled:opacity-40",
} as const;

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-[0.95rem]",
  lg: "px-4 py-3 text-base",
} as const;

type ButtonVariant = keyof typeof VARIANT_CLASSES;
type ButtonSize = keyof typeof SIZE_CLASSES;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function Button({ children, variant = "primary", size = "md", fullWidth = false, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={[
        "min-w-0 max-w-full whitespace-normal rounded-xl font-semibold transition-colors duration-150 disabled:cursor-not-allowed",
        fullWidth ? "w-full" : "",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(" ").trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export type { ButtonProps, ButtonSize, ButtonVariant };
