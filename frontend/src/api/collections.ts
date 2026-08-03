import { apiClient } from './client';
import type { Bookmark, Collection } from './types';

export const collectionsApi = {
  list: () => apiClient.get<Collection[]>('/collections'),
  getOne: (id: string) => apiClient.get<Collection>(`/collections/${id}`),
  getBookmarks: (id: string) => apiClient.get<Bookmark[]>(`/collections/${id}/bookmarks`),
  create: (name: string) => apiClient.post<Collection>('/collections', { name }),
  remove: (id: string) => apiClient.delete(`/collections/${id}`),
};
