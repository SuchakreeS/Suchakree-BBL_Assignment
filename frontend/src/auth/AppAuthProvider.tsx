import type { ReactNode } from 'react';
import { OidcAppAuthProvider } from './OidcAppAuthProvider';
import { MockAppAuthProvider } from './MockAppAuthProvider';

export const isMockMode = import.meta.env.VITE_AUTH_MODE === 'mock';

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const Provider = isMockMode ? MockAppAuthProvider : OidcAppAuthProvider;
  return <Provider>{children}</Provider>;
}
