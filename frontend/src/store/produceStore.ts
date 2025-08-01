// frontend/src/store/produceStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import apiService from '../services/api';
import { Produce } from '../types';

interface ProduceState {
  // State
  listings: Produce[];
  myListings: Produce[];
  currentListing: Produce | null;
  loading: boolean;
  error: string | null;
  filters: {
    category: string;
    location: string;
    priceRange: [number, number] | null;
    searchTerm: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };

  // Actions
  setListings: (listings: Produce[]) => void;
  setMyListings: (listings: Produce[]) => void;
  addListing: (listing: Produce) => void;
  updateListing: (id: number, updates: Partial<Produce>) => void;
  removeListing: (id: number) => void;
  setCurrentListing: (listing: Produce | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<ProduceState['filters']>) => void;
  setPagination: (pagination: Partial<ProduceState['pagination']>) => void;
  clearError: () => void;

  // Async actions
  fetchListings: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    location?: string;
    search?: string;
  }) => Promise<void>;
  fetchListingById: (id: number) => Promise<void>;
  createListing: (
    listingData: Omit<Produce, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<Produce>;
  updateListingById: (id: number, updates: Partial<Produce>) => Promise<void>;
  deleteListingById: (id: number) => Promise<void>;
  fetchMyListings: () => Promise<void>;
}

export const useProduceStore = create<ProduceState>()(
  immer((set, get) => ({
    // Initial state
    listings: [],
    myListings: [],
    currentListing: null,
    loading: false,
    error: null,
    filters: {
      category: '',
      location: '',
      priceRange: null,
      searchTerm: '',
    },
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      hasMore: true,
    },

    // Synchronous actions
    setListings: (listings) =>
      set((state) => {
        state.listings = listings;
      }),

    setMyListings: (listings) =>
      set((state) => {
        state.myListings = listings;
      }),

    addListing: (listing) =>
      set((state) => {
        state.listings.unshift(listing); // Add to beginning
        state.pagination.total += 1;
      }),

    updateListing: (id, updates) =>
      set((state) => {
        const index = state.listings.findIndex((listing) => listing.id === id);
        if (index !== -1 && state.listings[index]) {
          Object.assign(state.listings[index]!, updates);
        }
        const myIndex = state.myListings.findIndex(
          (listing) => listing.id === id
        );
        if (myIndex !== -1 && state.myListings[myIndex]) {
          Object.assign(state.myListings[myIndex]!, updates);
        }
        if (state.currentListing?.id === id) {
          Object.assign(state.currentListing, updates);
        }
      }),

    removeListing: (id) =>
      set((state) => {
        state.listings = state.listings.filter((listing) => listing.id !== id);
        state.myListings = state.myListings.filter(
          (listing) => listing.id !== id
        );
        if (state.currentListing?.id === id) {
          state.currentListing = null;
        }
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      }),

    setCurrentListing: (listing) =>
      set((state) => {
        state.currentListing = listing;
      }),

    setLoading: (loading) =>
      set((state) => {
        state.loading = loading;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
      }),

    setFilters: (filters) =>
      set((state) => {
        Object.assign(state.filters, filters);
      }),

    setPagination: (pagination) =>
      set((state) => {
        Object.assign(state.pagination, pagination);
      }),

    clearError: () =>
      set((state) => {
        state.error = null;
      }),

    // Async actions
    fetchListings: async (params = {}) => {
      const state = get();
      set((draft) => {
        draft.loading = true;
        draft.error = null;
      });

      try {
        const queryParams = new URLSearchParams();
        const page = params.page || state.pagination.page;
        const limit = params.limit || state.pagination.limit;

        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());

        if (params.category || state.filters.category) {
          queryParams.append(
            'category',
            params.category || state.filters.category
          );
        }
        if (params.location || state.filters.location) {
          queryParams.append(
            'location',
            params.location || state.filters.location
          );
        }
        if (params.search || state.filters.searchTerm) {
          queryParams.append(
            'search',
            params.search || state.filters.searchTerm
          );
        }

        const response = await apiService.request(
          `/api/produce?${queryParams.toString()}`
        );

        set((draft) => {
          if (page === 1) {
            draft.listings = response.listings || response;
          } else {
            draft.listings.push(...(response.listings || response));
          }

          draft.pagination = {
            page,
            limit,
            total: response.total || draft.listings.length,
            hasMore:
              response.hasMore !== undefined
                ? response.hasMore
                : (response.listings || response).length === limit,
          };

          draft.loading = false;
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch listings';
        set((draft) => {
          draft.loading = false;
          draft.error = errorMessage;
        });
        throw error;
      }
    },

    fetchListingById: async (id) => {
      set((draft) => {
        draft.loading = true;
        draft.error = null;
      });

      try {
        const listing = await apiService.request(`/api/produce/${id}`);
        set((draft) => {
          draft.currentListing = listing;
          draft.loading = false;
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch listing';
        set((draft) => {
          draft.loading = false;
          draft.error = errorMessage;
        });
        throw error;
      }
    },

    createListing: async (listingData) => {
      set((draft) => {
        draft.loading = true;
        draft.error = null;
      });

      try {
        // Convert object to FormData for API
        const formData = new FormData();
        Object.entries(listingData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        });

        const newListing = await apiService.createListing(formData);

        set((draft) => {
          draft.listings.unshift(newListing); // Add to beginning with optimistic update
          draft.pagination.total += 1;
          draft.loading = false;
        });

        return newListing;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create listing';
        set((draft) => {
          draft.loading = false;
          draft.error = errorMessage;
        });
        throw error;
      }
    },

    updateListingById: async (id, updates) => {
      // Optimistic update
      const state = get();
      const originalListing = state.listings.find((l) => l.id === id);

      set((draft) => {
        draft.loading = true;
        draft.error = null;
        // Apply optimistic update
        const index = draft.listings.findIndex((listing) => listing.id === id);
        if (index !== -1 && draft.listings[index]) {
          draft.listings[index] = { ...draft.listings[index], ...updates };
        }
        if (draft.currentListing?.id === id) {
          draft.currentListing = { ...draft.currentListing, ...updates };
        }
      });

      try {
        // Convert object to FormData for API
        const formData = new FormData();
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        });

        const updatedListing = await apiService.updateListing(id, formData);

        set((draft) => {
          // Replace optimistic update with server response
          const index = draft.listings.findIndex(
            (listing) => listing.id === id
          );
          if (index !== -1) {
            draft.listings[index] = updatedListing;
          }
          if (draft.currentListing?.id === id) {
            draft.currentListing = updatedListing;
          }
          draft.loading = false;
        });
      } catch (error) {
        // Revert optimistic update
        if (originalListing) {
          set((draft) => {
            const index = draft.listings.findIndex(
              (listing) => listing.id === id
            );
            if (index !== -1) {
              draft.listings[index] = originalListing;
            }
            if (draft.currentListing?.id === id) {
              draft.currentListing = originalListing;
            }
          });
        }

        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update listing';
        set((draft) => {
          draft.loading = false;
          draft.error = errorMessage;
        });
        throw error;
      }
    },

    deleteListingById: async (id) => {
      // Store for potential rollback
      const state = get();
      const deletedListing = state.listings.find((l) => l.id === id);
      const deletedIndex = state.listings.findIndex((l) => l.id === id);

      // Optimistic removal
      set((draft) => {
        draft.loading = true;
        draft.error = null;
        draft.listings = draft.listings.filter((listing) => listing.id !== id);
        if (draft.currentListing?.id === id) {
          draft.currentListing = null;
        }
        draft.pagination.total = Math.max(0, draft.pagination.total - 1);
      });

      try {
        await apiService.deleteListing(id);
        set((draft) => {
          draft.loading = false;
        });
      } catch (error) {
        // Rollback optimistic deletion
        if (deletedListing && deletedIndex !== -1) {
          set((draft) => {
            draft.listings.splice(deletedIndex, 0, deletedListing);
            draft.pagination.total += 1;
          });
        }

        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete listing';
        set((draft) => {
          draft.loading = false;
          draft.error = errorMessage;
        });
        throw error;
      }
    },

    fetchMyListings: async () => {
      // Check if user is authenticated before making API call
      const token = localStorage.getItem('token');
      if (!token) {
        set((draft) => {
          draft.myListings = [];
          draft.loading = false;
          draft.error = null;
        });
        return;
      }

      set((draft) => {
        draft.loading = true;
        draft.error = null;
      });

      try {
        const response = await apiService.getMyListings();
        set((draft) => {
          // Extract listings from backend response structure
          // Backend returns { success: true, data: listings, pagination: {...} }
          const listings = (response as any)?.data || response;
          // Ensure we always store an array
          draft.myListings = Array.isArray(listings) ? listings : [];
          draft.loading = false;
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to fetch your listings';
        set((draft) => {
          draft.loading = false;
          draft.error = errorMessage;
        });
        throw error;
      }
    },
  }))
);
