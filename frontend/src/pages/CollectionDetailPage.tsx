import { useEffect, useState } from 'react';
import { Alert, Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import { useParams } from 'react-router';
import { collectionsApi } from '../api/collections';
import { bookmarksApi } from '../api/bookmarks';
import type { Bookmark, Collection } from '../api/types';

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    collectionsApi.getOne(id).then(setCollection).catch((e) => setError(e.message));
    bookmarksApi
      .list()
      .then((all) => setBookmarks(all.filter((b) => b.collectionId === id)))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!collection) return null;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {collection.name}
      </Typography>
      <List>
        {bookmarks.map((b) => (
          <ListItem key={b.id}>
            <ListItemText primary={b.title} secondary={b.url} />
          </ListItem>
        ))}
        {bookmarks.length === 0 && <Typography color="text.secondary">No bookmarks yet.</Typography>}
      </List>
    </Box>
  );
}
