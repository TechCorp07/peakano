'use client';

import { useMemo } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from '@/store';

// Store singleton for client-side
let clientStore: AppStore | undefined;

function getOrCreateStore(): AppStore {
  // Server-side: always create a new store
  if (typeof window === 'undefined') {
    return makeStore();
  }
  // Client-side: reuse the same store
  if (!clientStore) {
    clientStore = makeStore();
  }
  return clientStore;
}

/**
 * Redux Store Provider for Next.js App Router
 * 
 * This component ensures we create a new store instance for each request
 * in server-side rendering, while maintaining a single instance on the client.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Use useMemo to ensure store is only created once per render tree
  // On client, this always returns the same singleton store
  // On server, this creates a new store per request
  const store = useMemo(() => getOrCreateStore(), []);
  
  return <Provider store={store}>{children}</Provider>;
}
