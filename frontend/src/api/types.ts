export interface Collection {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  ownerId: string;
  title: string;
  url: string;
  notes?: string | null;
  collectionId?: string | null;
  createdAt: string;
}
