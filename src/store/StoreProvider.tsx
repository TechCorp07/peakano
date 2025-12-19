'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from '@/store';

/**
 * Redux Store Provider for Next.js App Router
 * 
 * This component ensures we create a new store instance for each request
 * in server-side rendering, while maintaining a single instance on the client.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Use ref to ensure store is only created once per client session
  const storeRef = useRef<AppStore | null>(null);
  
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }
  
  return <Provider store={storeRef.current}>{children}</Provider>;
}
