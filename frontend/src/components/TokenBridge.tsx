import { useEffect } from 'react';
import { useAppAuth } from '../auth/AppAuthContext';
import { setTokenGetter } from '../api/client';

export function TokenBridge() {
  const auth = useAppAuth();

  useEffect(() => {
    setTokenGetter(auth.getToken);
  }, [auth]);

  return null;
}
