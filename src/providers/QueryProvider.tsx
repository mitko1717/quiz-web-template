"use client";

import { ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { isLikelyNetworkError, useNetworkStatus } from '@/hooks/useNetworkStatus';

const DEFAULT_STALE_TIME_MS = 60_000;
const MAX_NETWORK_RETRIES = 4;
const MAX_RETRY_DELAY_MS = 15_000;

function OfflineRefetchOnReconnect({ queryClient }: { queryClient: QueryClient }) {
  const { isOnline } = useNetworkStatus();
  const wasOnlineRef = useRef(isOnline);

  useEffect(() => {
    const wasOnline = wasOnlineRef.current;
    wasOnlineRef.current = isOnline;

    if (!wasOnline && isOnline) {
      void queryClient.refetchQueries({ type: 'active' });
    }
  }, [isOnline, queryClient]);

  return null;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: DEFAULT_STALE_TIME_MS,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
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
      <OfflineRefetchOnReconnect queryClient={queryClient} />
      {children}
      {process.env.NODE_ENV === 'development' ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
