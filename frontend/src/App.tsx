import { Navigate, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { TokenBridge } from './components/TokenBridge';
import { CollectionsPage } from './pages/CollectionsPage';
import { CollectionDetailPage } from './pages/CollectionDetailPage';
import { BookmarksPage } from './pages/BookmarksPage';

export default function App() {
  return (
    <>
      <TokenBridge />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/collections" replace />} />
          <Route
            path="/collections"
            element={
              <RequireAuth>
                <CollectionsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/collections/:id"
            element={
              <RequireAuth>
                <CollectionDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/bookmarks"
            element={
              <RequireAuth>
                <BookmarksPage />
              </RequireAuth>
            }
          />
        </Route>
      </Routes>
    </>
  );
}
