import { useState, type ReactNode } from 'react';
import { AppAuthContext } from './AppAuthContext';

const STORAGE_KEY = 'mock-auth-sub';

/**
 * Local/E2E-only stand-in for OidcAppAuthProvider. Never verifies a
 * signature — it exists so UI CRUD flows can be exercised without a live
 * Auth0 universal-login redirect. Only wired up when VITE_AUTH_MODE=mock.
 * The backend only trusts these tokens when AUTH_MOCK_ENABLED=true.
 */
export function MockAppAuthProvider({ children }: { children: ReactNode }) {
  const [sub, setSub] = useState<string | null>(() => sessionStorage.getItem(STORAGE_KEY));

  const signIn = (mockSub = 'auth0|user-a') => {
    sessionStorage.setItem(STORAGE_KEY, mockSub);
    setSub(mockSub);
  };

  const signOut = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSub(null);
  };

  return (
    <AppAuthContext.Provider
      value={{
        isLoading: false,
        isAuthenticated: !!sub,
        userLabel: sub ?? undefined,
        getToken: () => (sub ? `mock:${sub}` : undefined),
        signIn,
        signOut,
      }}
    >
      {children}
    </AppAuthContext.Provider>
  );
}
