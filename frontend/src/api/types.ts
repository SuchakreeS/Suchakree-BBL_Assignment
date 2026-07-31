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
  collectionId?: string | null;
  createdAt: string;
}
