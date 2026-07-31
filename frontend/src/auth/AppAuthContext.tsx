import { createContext, useContext } from 'react';

export interface AppAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  userLabel?: string;
  getToken: () => string | undefined;
  signIn: (mockSub?: string) => void;
  signOut: () => void;
}

export const AppAuthContext = createContext<AppAuthState | null>(null);

export function useAppAuth(): AppAuthState {
  const ctx = useContext(AppAuthContext);
  if (!ctx) throw new Error('useAppAuth must be used within an AppAuthProvider');
  return ctx;
}
