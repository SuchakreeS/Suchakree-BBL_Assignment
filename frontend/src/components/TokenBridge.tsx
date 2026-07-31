import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { setTokenGetter } from '../api/client';

export function TokenBridge() {
  const auth = useAuth();

  useEffect(() => {
    setTokenGetter(() => auth.user?.access_token);
  }, [auth.user]);

  return null;
}
