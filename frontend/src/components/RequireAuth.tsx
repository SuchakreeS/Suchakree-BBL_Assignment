import type { ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';
import { Box, Button, CircularProgress, Typography } from '@mui/material';

export function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2} mt={8}>
        <Typography variant="h5">Sign in required</Typography>
        <Button variant="contained" onClick={() => auth.signinRedirect()}>
          Sign In
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
}
