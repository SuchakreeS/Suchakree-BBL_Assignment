import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from 'react-oidc-context';
import { authConfig } from './authConfig';
import { AppAuthContext } from './AppAuthContext';

function OidcBridge({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AppAuthContext.Provider
      value={{
        isLoading: auth.isLoading,
        isAuthenticated: auth.isAuthenticated,
        userLabel: auth.user?.profile.email ?? auth.user?.profile.sub,
        getToken: () => auth.user?.access_token,
        signIn: () => auth.signinRedirect(),
        signOut: () => auth.removeUser(),
      }}
    >
      {children}
    </AppAuthContext.Provider>
  );
}

export function OidcAppAuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider {...authConfig}>
      <OidcBridge>{children}</OidcBridge>
    </AuthProvider>
  );
}
