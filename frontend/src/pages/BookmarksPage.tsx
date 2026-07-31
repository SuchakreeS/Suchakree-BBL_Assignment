import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { bookmarksApi } from '../api/bookmarks';
import { collectionsApi } from '../api/collections';
import type { Bookmark, Collection } from '../api/types';

export function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [filterId, setFilterId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    bookmarksApi.list().then(setBookmarks).catch((e) => setError(e.message));
    collectionsApi.list().then(setCollections).catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    if (!title.trim() || !url.trim()) return;
    try {
      await bookmarksApi.create({
        title: title.trim(),
        url: url.trim(),
        collectionId: collectionId || undefined,
      });
      setTitle('');
      setUrl('');
      setCollectionId('');
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await bookmarksApi.remove(id);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const visible = filterId ? bookmarks.filter((b) => b.collectionId === filterId) : bookmarks;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <TextField label="Title" size="small" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField label="URL" size="small" value={url} onChange={(e) => setUrl(e.target.value)} />
        <TextField
          select
          label="Collection"
          size="small"
          value={collectionId}
          onChange={(e) => setCollectionId(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">None</MenuItem>
          {collections.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" onClick={handleCreate}>
          Add
        </Button>
      </Box>

      <TextField
        select
        label="Filter by collection"
        size="small"
        value={filterId}
        onChange={(e) => setFilterId(e.target.value)}
        sx={{ minWidth: 200, mb: 2 }}
      >
        <MenuItem value="">All</MenuItem>
        {collections.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>

      <List>
        {visible.map((b) => (
          <ListItem
            key={b.id}
            secondaryAction={
              <IconButton edge="end" onClick={() => handleDelete(b.id)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={
                <Link href={b.url} target="_blank" rel="noopener noreferrer">
                  {b.title}
                </Link>
              }
              secondary={collections.find((c) => c.id === b.collectionId)?.name}
            />
          </ListItem>
        ))}
        {visible.length === 0 && <Alert severity="info">No bookmarks.</Alert>}
      </List>
    </Box>
  );
}
