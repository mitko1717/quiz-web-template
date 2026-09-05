"use client";

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { isLikelyNetworkError } from '@/hooks/useNetworkStatus';

const DEFAULT_STALE_TIME_MS = 20_000;
const DEFAULT_GC_TIME_MS = 5 * 60_000;
const MAX_NETWORK_RETRIES = 4;
const MAX_RETRY_DELAY_MS = 15_000;

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: DEFAULT_STALE_TIME_MS,
            gcTime: DEFAULT_GC_TIME_MS,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: (failureCount, error) => {
              if (isLikelyNetworkError(error)) return failureCount < MAX_NETWORK_RETRIES;
              return failureCount < 1;
            },
            retryDelay: (attemptIndex) => Math.min(1_000 * 2 ** attemptIndex, MAX_RETRY_DELAY_MS),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
