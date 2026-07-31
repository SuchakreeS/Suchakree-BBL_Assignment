import { AppBar, Box, Button, Container, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useAppAuth } from '../auth/AppAuthContext';

export function Layout() {
  const auth = useAppAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tab = location.pathname.startsWith('/bookmarks') ? '/bookmarks' : '/collections';

  return (
    <Box>
      <AppBar position="static">
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            BBL Bookmarks
          </Typography>
          {auth.isAuthenticated && (
            <Tabs value={tab} textColor="inherit" indicatorColor="secondary">
              <Tab label="Collections" value="/collections" onClick={() => navigate('/collections')} />
              <Tab label="Bookmarks" value="/bookmarks" onClick={() => navigate('/bookmarks')} />
            </Tabs>
          )}
          {auth.isAuthenticated ? (
            <>
              {auth.userLabel && (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {auth.userLabel}
                </Typography>
              )}
              <Button color="inherit" onClick={() => auth.signOut()}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button color="inherit" onClick={() => auth.signIn()}>
              Sign In
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
