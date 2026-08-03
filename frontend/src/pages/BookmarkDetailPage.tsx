import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Link, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router';
import { bookmarksApi } from '../api/bookmarks';
import { collectionsApi } from '../api/collections';
import type { Bookmark, Collection } from '../api/types';

export function BookmarkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    bookmarksApi
      .getOne(id)
      .then((b) => {
        setBookmark(b);
        if (b.collectionId) {
          collectionsApi.getOne(b.collectionId).then(setCollection).catch(() => setCollection(null));
        }
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!bookmark) return null;

  return (
    <Box>
      <Button size="small" onClick={() => navigate('/bookmarks')} sx={{ mb: 2 }}>
        &larr; Back to bookmarks
      </Button>
      <Typography variant="h5" gutterBottom>
        {bookmark.title}
      </Typography>
      <Link href={bookmark.url} target="_blank" rel="noopener noreferrer" sx={{ display: 'block', mb: 2 }}>
        {bookmark.url}
      </Link>
      {collection && <Chip label={collection.name} size="small" sx={{ mb: 2 }} />}
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Notes
      </Typography>
      <Typography sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
        {bookmark.notes || <Typography component="span" color="text.secondary">No notes.</Typography>}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        Created {new Date(bookmark.createdAt).toLocaleString()}
      </Typography>
    </Box>
  );
}
