import { apiClient } from './client';
import type { Collection } from './types';

export const collectionsApi = {
  list: () => apiClient.get<Collection[]>('/collections'),
  getOne: (id: string) => apiClient.get<Collection>(`/collections/${id}`),
  create: (name: string) => apiClient.post<Collection>('/collections', { name }),
  remove: (id: string) => apiClient.delete(`/collections/${id}`),
};
