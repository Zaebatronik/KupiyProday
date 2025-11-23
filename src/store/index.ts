import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Listing, Chat, Language } from '@/types';

interface AppState {
  // User
  user: User | null;
  isRegistered: boolean;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Listings
  listings: Listing[];
  setListings: (listings: Listing[]) => void;
  addListing: (listing: Listing) => void;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  deleteListing: (id: string) => void;

  // Favorites
  favorites: string[];
  addToFavorites: (listingId: string) => void;
  removeFromFavorites: (listingId: string) => void;
  isFavorite: (listingId: string) => boolean;

  // Chats
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;

  // Filters
  filters: {
    category: string;
    minPrice: number | null;
    maxPrice: number | null;
    searchQuery: string;
  };
  setFilters: (filters: Partial<AppState['filters']>) => void;
  resetFilters: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User
      user: null,
      isRegistered: false,
      setUser: (user) => set({ user, isRegistered: true }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      clearUser: () => set({ user: null, isRegistered: false }),

      // Language
      language: 'ru',
      setLanguage: (lang) => set({ language: lang }),

      // Listings
      listings: [],
      setListings: (listings) => set({ listings }),
      addListing: (listing) =>
        set((state) => ({ listings: [...state.listings, listing] })),
      updateListing: (id, updates) =>
        set((state) => ({
          listings: state.listings.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        })),
      deleteListing: (id) =>
        set((state) => ({
          listings: state.listings.filter((l) => l.id !== id),
        })),

      // Favorites
      favorites: [],
      addToFavorites: (listingId) =>
        set((state) => ({
          favorites: [...state.favorites, listingId],
        })),
      removeFromFavorites: (listingId) =>
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== listingId),
        })),
      isFavorite: (listingId) => get().favorites.includes(listingId),

      // Chats
      chats: [],
      setChats: (chats) => set({ chats }),
      addChat: (chat) => set((state) => ({ chats: [...state.chats, chat] })),
      updateChat: (chatId, updates) =>
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId ? { ...c, ...updates } : c
          ),
        })),

      // Filters
      filters: {
        category: 'all',
        minPrice: null,
        maxPrice: null,
        searchQuery: '',
      },
      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),
      resetFilters: () =>
        set({
          filters: {
            category: 'all',
            minPrice: null,
            maxPrice: null,
            searchQuery: '',
          },
        }),
    }),
    {
      name: 'kupyprodai-storage',
    }
  )
);
