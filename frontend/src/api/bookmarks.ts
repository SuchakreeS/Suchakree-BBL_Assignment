import { apiClient } from './client';
import type { Bookmark } from './types';

export const bookmarksApi = {
  list: (collectionId?: string) =>
    apiClient.get<Bookmark[]>(
      collectionId ? `/bookmarks?collectionId=${encodeURIComponent(collectionId)}` : '/bookmarks',
    ),
  getOne: (id: string) => apiClient.get<Bookmark>(`/bookmarks/${id}`),
  create: (data: { title: string; url: string; notes?: string; collectionId?: string }) =>
    apiClient.post<Bookmark>('/bookmarks', data),
  remove: (id: string) => apiClient.delete(`/bookmarks/${id}`),
};
