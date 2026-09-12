"use client";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PageWrapper } from "@/components/PageWrapper";

export function TabMountSpinner() {
  return (
    <PageWrapper>
      <div className="flex min-h-[60vh] items-center justify-center" aria-busy="true">
        <LoadingSpinner size="lg" />
      </div>
    </PageWrapper>
  );
}
