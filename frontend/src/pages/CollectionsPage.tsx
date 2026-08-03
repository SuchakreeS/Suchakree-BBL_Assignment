import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router';
import { collectionsApi } from '../api/collections';
import type { Collection } from '../api/types';

export function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = () => {
    collectionsApi
      .list()
      .then(setCollections)
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await collectionsApi.create(name.trim());
      setName('');
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await collectionsApi.remove(id);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="New collection name"
          size="small"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button variant="contained" onClick={handleCreate}>
          Add
        </Button>
      </Box>
      <List>
        {collections.map((c) => (
          <ListItem
            key={c.id}
            disablePadding
            secondaryAction={
              <IconButton edge="end" onClick={() => handleDelete(c.id)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemButton onClick={() => navigate(`/collections/${c.id}`)}>
              <ListItemText primary={c.name} secondary={new Date(c.createdAt).toLocaleString()} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
