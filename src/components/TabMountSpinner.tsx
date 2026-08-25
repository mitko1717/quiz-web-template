"use client";

import { LoadingSpinner } from "@/components/LoadingSpinner";

export function TabMountSpinner() {
  return (
    <main className="app-page mx-auto flex w-full max-w-5xl flex-col px-4 sm:px-6">
      <div className="flex min-h-[60vh] items-center justify-center" aria-busy="true">
        <LoadingSpinner size="lg" />
      </div>
    </main>
  );
}
