// src/lib/slices/restaurantSlice.ts
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import apiClient from '../apiClient';
import type { RestaurantInfo, MenuItem, category, FAQItem } from '@/constants/types';
import type { RootState } from '../store/store';

interface InitialDataResponse {
  restaurantInfo: RestaurantInfo;
  popularItems: MenuItem[];
}

const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

export const fetchInitialRestaurantData = createAsyncThunk<InitialDataResponse>(
  'restaurant/fetchInitialData',
  async (_, { rejectWithValue }) => {
    try {

      const response = await apiClient.get(`/restaurants/${restaurantId}`); 

      if (!response.data || !response.data.restaurantInfo || !Array.isArray(response.data.popularItems)) {
         console.error('Invalid data structure received from /api/restaurants:', response.data);
         throw new Error('Invalid initial data received from server.');
      }
      return response.data as InitialDataResponse;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch initial restaurant data';
      console.error('fetchInitialRestaurantData Error:', message, error.response?.data);
      return rejectWithValue(message);
    }
  }
);


export const fetchAllMenuItemsFromApi = createAsyncThunk<MenuItem[]>(
  'restaurant/fetchAllMenuItemsFromApi',
  async (_, { getState, rejectWithValue }) => {

    if (!restaurantId) {
        return rejectWithValue('Restaurant ID not found in state. Cannot fetch menu items.');
    }

    try {
      // Use the correct backend endpoint structure
      const response = await apiClient.get(`/restaurants/${restaurantId}/menu`);

      if (!Array.isArray(response.data)) {
        console.error(`Invalid data structure received from /api/restaurants/${restaurantId}/menu: Expected array, got:`, response.data);
        throw new Error('Invalid menu item data received from server.');
      }

      return response.data as MenuItem[];
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch all menu items';
       console.error('fetchAllMenuItemsFromApi Error:', message, error.response?.data);
      return rejectWithValue(message);
    }
  }
);

interface RestaurantState {
  info: RestaurantInfo | null;
  menuItems: MenuItem[]; 
  popularItems: MenuItem[];
  loading: {
    initial: 'idle' | 'pending' | 'succeeded' | 'failed';
    allItems: 'idle' | 'pending' | 'succeeded' | 'failed';
  };
  error: {
    initial: string | null;
    allItems: string | null;
  };
}

const initialState: RestaurantState = {
  info: null,
  menuItems: [],
  popularItems: [],
  loading: {
    initial: 'idle',
    allItems: 'idle',
  },
  error: {
    initial: null,
    allItems: null,
  },
};

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = { initial: null, allItems: null };
    },
    updateFaqsLocally: (state, action: PayloadAction<FAQItem[]>) => {
      if (state.info) {
          if (Array.isArray(action.payload)) {
              state.info.faqs = action.payload;
          }
      }
    },
    setRestaurantData: (state, action: PayloadAction<{info: RestaurantInfo, items: MenuItem[]}>) => {
      state.info = action.payload.info;
      state.menuItems = action.payload.items;
      const popularCategory = state.info?.categories.find(cat => cat.name.toLowerCase() === 'popular');
      state.popularItems = popularCategory
          ? state.menuItems.filter(item => popularCategory.ids.includes(item.id))
          : [];
      state.loading = { initial: 'succeeded', allItems: 'succeeded' };
      state.error = { initial: null, allItems: null };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Initial Data (Info + Popular)
      .addCase(fetchInitialRestaurantData.pending, (state) => {
        state.loading.initial = 'pending';
        state.error.initial = null;
      })
      .addCase(fetchInitialRestaurantData.fulfilled, (state, action: PayloadAction<InitialDataResponse>) => {
        state.loading.initial = 'succeeded';
        state.info = action.payload.restaurantInfo;
        state.popularItems = action.payload.popularItems || [];
        const popularItemIds = new Set(state.popularItems.map(item => item.id));
        const existingMenuItemIds = new Set(state.menuItems.map(item => item.id));
        state.popularItems.forEach(popItem => {
            if (!existingMenuItemIds.has(popItem.id)) {
                state.menuItems.push(popItem);
                 existingMenuItemIds.add(popItem.id); // Add to set to track merged items
            }
        });
      })
      .addCase(fetchInitialRestaurantData.rejected, (state, action) => {
        state.loading.initial = 'failed';
        state.error.initial = action.payload as string;
      })

      // Fetch All Menu Items
      .addCase(fetchAllMenuItemsFromApi.pending, (state) => {
        state.loading.allItems = 'pending';
        state.error.allItems = null;
      })
      // --- UPDATED: Expect PayloadAction<MenuItem[]> ---
      .addCase(fetchAllMenuItemsFromApi.fulfilled, (state, action: PayloadAction<MenuItem[]>) => {
        state.loading.allItems = 'succeeded';

        const existingItemIds = new Set(state.menuItems.map(item => item.id));
        const newItems = action.payload || [];
        newItems.forEach(newItem => {
            if (!existingItemIds.has(newItem.id)) {
                state.menuItems.push(newItem);
                existingItemIds.add(newItem.id); // Add to set
            }
            // Optional: Update existing item if new data is more complete?
            // else {
            //    const index = state.menuItems.findIndex(item => item.id === newItem.id);
            //    if (index !== -1) state.menuItems[index] = { ...state.menuItems[index], ...newItem };
            // }
        });
         // Re-process popular items in case the full list provides more details
         // or if initial fetch failed but this one succeeded
         if (state.info) {
             const popularCategory = state.info.categories.find(cat => cat.name === 'Popular'); // Match case used in backend
             state.popularItems = popularCategory
                 ? state.menuItems.filter(item => popularCategory.ids.includes(item.id))
                 : [];
         }
      })
      .addCase(fetchAllMenuItemsFromApi.rejected, (state, action) => {
        state.loading.allItems = 'failed';
        state.error.allItems = action.payload as string;
      });
  },
});

export const { clearErrors, setRestaurantData, updateFaqsLocally } = restaurantSlice.actions;
export default restaurantSlice.reducer;

// --- Selectors ---

export const selectRestaurantInfo = (state: RootState): RestaurantInfo | null => state.restaurant.info;
export const selectAllMenuItems = (state: RootState): MenuItem[] => state.restaurant.menuItems;
export const selectPopularItems = (state: RootState): MenuItem[] => state.restaurant.popularItems;
export const selectRestaurantLoadingState = (state: RootState): RestaurantState['loading'] => state.restaurant.loading;
export const selectRestaurantErrorState = (state: RootState): RestaurantState['error'] => state.restaurant.error;

// Selector to get all categories defined in the restaurant info
export const selectCategories = createSelector(
  [selectRestaurantInfo],
  (restaurant) => {
    return restaurant ? restaurant.categories || [] : [];
  }
);

export const selectMenuItemsByCategoryName = (categoryName: string) =>
  createSelector(
    [selectCategories, selectAllMenuItems],
    (categories, menuItems): MenuItem[] => {
      const category = categories.find(cat => cat.name === categoryName);
      if (!category) return [];
      return menuItems.filter(item => category.ids.includes(item.id));
    }
  );

export const selectHasLoadedInitialData = (state: RootState): boolean => {
    return state.restaurant.loading.initial === 'succeeded';
};

export const selectHasLoadedAllItems = (state: RootState): boolean => {
    return state.restaurant.loading.allItems === 'succeeded';
};
