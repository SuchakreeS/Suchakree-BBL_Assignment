import type { ReactNode } from 'react';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useAppAuth } from '../auth/AppAuthContext';
import { isMockMode } from '../auth/AppAuthProvider';

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAppAuth();

  if (auth.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 8 }}>
        <Typography variant="h5">Sign in required</Typography>
        {isMockMode ? (
          <Stack direction="row" sx={{ gap: 2 }}>
            <Button variant="contained" onClick={() => auth.signIn('auth0|user-a')}>
              Sign in as User A
            </Button>
            <Button variant="outlined" onClick={() => auth.signIn('auth0|user-b')}>
              Sign in as User B
            </Button>
          </Stack>
        ) : (
          <Button variant="contained" onClick={() => auth.signIn()}>
            Sign In
          </Button>
        )}
      </Box>
    );
  }

  return <>{children}</>;
}
