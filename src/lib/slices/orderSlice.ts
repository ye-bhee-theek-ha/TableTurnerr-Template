// src/lib/slices/orderSlice.ts

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import apiClient from '../apiClient'; // Adjust path
import type { RootState } from '../store/store'; // Adjust path
import type { Order, OrderStatus } from '@/constants/types'; // Adjust path
import { logoutUser } from './authSlice'; // Listen for logout

// Define the active statuses for filtering
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'];

// Define the state structure for the order slice
interface OrderState {
  allOrders: Order[]; // Array to hold all user's orders
  activeOrders: Order[]; // Array to hold only active orders
  loadingAll: 'idle' | 'pending' | 'succeeded' | 'failed';
  loadingActive: 'idle' | 'pending' | 'succeeded' | 'failed';
  errorAll: string | null;
  errorActive: string | null;
}

// Initial state
const initialState: OrderState = {
  allOrders: [],
  activeOrders: [],
  loadingAll: 'idle',
  loadingActive: 'idle',
  errorAll: null,
  errorActive: null,
};

// --- Async Thunk to Fetch ALL User Orders ---
export const fetchUserOrders = createAsyncThunk<Order[]>(
  'orders/fetchAllUserOrders', // Renamed action type for clarity
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/orders/mine'); // Endpoint for all orders
      if (!Array.isArray(response.data)) {
          console.error("API Error: /api/orders/mine did not return an array.", response.data);
          throw new Error('Invalid order data received from server.');
      }
      // Convert date strings back to Date objects or keep as ISO strings
      return response.data.map(order => ({
          ...order,
          createdAt: order.createdAt ? new Date(order.createdAt) : new Date(0),
          updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(0),
          estimatedCompletionTime: order.estimatedCompletionTime ? new Date(order.estimatedCompletionTime) : null,
      })) as Order[];
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch all orders';
      console.error('fetchUserOrders Error:', message, error.response?.data);
      return rejectWithValue(message);
    }
  }
);

// --- Async Thunk to Fetch ACTIVE User Orders ---
export const fetchActiveUserOrders = createAsyncThunk<Order[]>(
    'orders/fetchActiveUserOrders',
    async (_, { rejectWithValue }) => {
      try {
        const response = await apiClient.get('/orders/mine/active');
        if (!Array.isArray(response.data)) {
            console.error("API Error: /api/orders/mine/active did not return an array.", response.data);
            throw new Error('Invalid active order data received from server.');
        }
         // Convert date strings back to Date objects or keep as ISO strings
        return response.data.map(order => ({
            ...order,
            createdAt: order.createdAt ? new Date(order.createdAt) : new Date(0),
            updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(0),
            estimatedCompletionTime: order.estimatedCompletionTime ? new Date(order.estimatedCompletionTime) : null,
        })) as Order[];
      } catch (error: any) {
        const message = error.response?.data?.message || error.message || 'Failed to fetch active orders';
        console.error('fetchActiveUserOrders Error:', message, error.response?.data);
        return rejectWithValue(message);
      }
    }
);


// --- Slice Definition ---
const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // Updates status in BOTH lists if the order exists there
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: OrderStatus }>) => {
      const { orderId, status } = action.payload;
      const updatedAt = new Date().toISOString(); // Use ISO string for consistency

      const allIndex = state.allOrders.findIndex(order => order.id === orderId);
      if (allIndex !== -1) {
        state.allOrders[allIndex].status = status;
        state.allOrders[allIndex].updatedAt = updatedAt;
      }

      const activeIndex = state.activeOrders.findIndex(order => order.id === orderId);
      if (activeIndex !== -1) {
          // If new status is still active, update it
          if (ACTIVE_ORDER_STATUSES.includes(status)) {
              state.activeOrders[activeIndex].status = status;
              state.activeOrders[activeIndex].updatedAt = updatedAt;
          } else {
              // If new status is NOT active, remove it from the active list
              state.activeOrders.splice(activeIndex, 1);
          }
      } else {
          // If the order wasn't in active list but now becomes active (e.g., undo cancel?), add it back?
          // This might require fetching the full order details again. For simplicity, we don't handle this case here.
      }
    },
    clearOrderErrors: (state) => { // Renamed for clarity
        state.errorAll = null;
        state.errorActive = null;
    },
    // Add an order locally (e.g., after successful creation via webhook update)
    // This helps update UI immediately without waiting for the next full fetch
    addOrderLocally: (state, action: PayloadAction<Order>) => {
        const newOrder = action.payload;
        // Prevent duplicates
        if (!state.allOrders.some(o => o.id === newOrder.id)) {
            state.allOrders.unshift(newOrder); // Add to beginning (newest)
             // Also add to active list if applicable
            if (ACTIVE_ORDER_STATUSES.includes(newOrder.status)) {
                 if (!state.activeOrders.some(o => o.id === newOrder.id)) {
                    state.activeOrders.unshift(newOrder);
                 }
            }
        }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch ALL User Orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loadingAll = 'pending';
        state.errorAll = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.loadingAll = 'succeeded';
        // Sort orders by creation date, newest first
        state.allOrders = action.payload.sort((a, b) =>
            (b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as string).getTime()) -
            (a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as string).getTime())
        );
        state.errorAll = null;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loadingAll = 'failed';
        state.errorAll = action.payload as string;
      })

      // Fetch ACTIVE User Orders
      .addCase(fetchActiveUserOrders.pending, (state) => {
        state.loadingActive = 'pending';
        state.errorActive = null;
      })
      .addCase(fetchActiveUserOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.loadingActive = 'succeeded';
         // Sort orders by creation date, newest first
        state.activeOrders = action.payload.sort((a, b) =>
            (b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt as string).getTime()) -
            (a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt as string).getTime())
        );
        state.errorActive = null;
      })
      .addCase(fetchActiveUserOrders.rejected, (state, action) => {
        state.loadingActive = 'failed';
        state.errorActive = action.payload as string;
      })

      // Clear orders on logout
      .addCase(logoutUser.fulfilled, (state) => {
          state.allOrders = [];
          state.activeOrders = [];
          state.loadingAll = 'idle';
          state.loadingActive = 'idle';
          state.errorAll = null;
          state.errorActive = null;
      });
  },
});

// Export actions
export const { updateOrderStatus, clearOrderErrors, addOrderLocally } = orderSlice.actions;

// --- Selectors ---
export const selectUserAllOrders = (state: RootState): Order[] => state.orders.allOrders;
export const selectUserActiveOrders = (state: RootState): Order[] => state.orders.activeOrders;
export const selectOrdersLoadingAll = (state: RootState): boolean => state.orders.loadingAll === 'pending';
export const selectOrdersLoadingActive = (state: RootState): boolean => state.orders.loadingActive === 'pending';
export const selectOrdersErrorAll = (state: RootState): string | null => state.orders.errorAll;
export const selectOrdersErrorActive = (state: RootState): string | null => state.orders.errorActive;

export const selectMostRecentActiveOrder = createSelector(
    [selectUserActiveOrders],
    (activeOrders): Order | null => {
        return activeOrders.length > 0 ? activeOrders[0] : null;
    }
);

// Export reducer
export default orderSlice.reducer;
