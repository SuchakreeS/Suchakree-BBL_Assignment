import type { AuthProviderProps } from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';

export const authConfig: AuthProviderProps = {
  authority: `https://${import.meta.env.VITE_AUTH0_DOMAIN}`,
  client_id: import.meta.env.VITE_AUTH0_CLIENT_ID,
  redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  extraQueryParams: {
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  },
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};
