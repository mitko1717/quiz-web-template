import type { ReactNode } from "react";

type PageWrapperProps = {
  children: ReactNode;
  className?: string;
};

export function PageWrapper({ children, className = "" }: PageWrapperProps) {
  return (
    <main
      className={[
        "app-page mx-auto flex w-full max-w-5xl flex-col px-4 sm:px-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </main>
  );
}
