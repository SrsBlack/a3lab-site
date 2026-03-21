import { create } from 'zustand';

export interface SearchResult {
  id: string;
  username: string;
  isVerified: boolean;
  postCount: number;
}

interface SearchState {
  query: string;
  results: SearchResult[];
  isSearching: boolean;

  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setSearching: (searching: boolean) => void;
  clear: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  results: [],
  isSearching: false,

  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setSearching: (isSearching) => set({ isSearching }),
  clear: () => set({ query: '', results: [], isSearching: false }),
}));
