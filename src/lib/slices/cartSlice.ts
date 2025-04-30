// src/lib/slices/cartSlice.ts

import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store/store';
import { CartItem, CartItemOptions, CartState, MenuItem } from '@/constants/types'; 
import { useMemo } from 'react';



// Initial state
const initialState: CartState = {
  items: [],
  isOpen: false,
};

/**
 * Generates a unique key for the options object.
 * @param options - The selected options object.
 * @returns A string key representing the options.
 */
const generateOptionsKey = (options: CartItemOptions): string => {
  return Object.keys(options)
    .sort() 
    .map(key => {
      const value = options[key];
      const valueString = Array.isArray(value) ? [...value].sort().join(',') : String(value);
      return `${key}:${valueString}`;
    })
    .join('|');
};



/**
 * Calculates the price per unit for a cart item, including base price and selected options.
 * @param item - The CartItem object.
 * @returns The calculated price for one unit of the item.
 */
export const calculatePriceForItem = (item: CartItem): number => {
    let calculatedPrice = parseFloat(item.price || '0') || 0;
 
    const normalizedOptionsDefinition = !item.options
    ? [] 
    : Array.isArray(item.options)
    ? item.options 
    : [item.options];

    for (const question in item.selectedOptions) {
      const selectedChoiceNames = item.selectedOptions[question]; 
      const choiceNamesArray = Array.isArray(selectedChoiceNames) ? selectedChoiceNames : [selectedChoiceNames];

      // Find the corresponding option definition in the original item's options array
      const optionDefinition = normalizedOptionsDefinition.find(opt => opt.Question === question);
      
      if (optionDefinition) {
        for (const choiceName of choiceNamesArray) {
          const choiceDefinition = optionDefinition.choices.find(choice => choice.name === choiceName);
          // Add the price of the selected choice (if found and price exists)
          if (choiceDefinition && typeof choiceDefinition.price === 'number') {
            calculatedPrice += choiceDefinition.price;
          }
        }
      }
    }
  
    // Ensure price is not negative
    return Math.max(0, calculatedPrice);
  };
  

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    openCart: (state) => {
      state.isOpen = true;
    },
    closeCart: (state) => {
      state.isOpen = false;
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },

    addItem: (state, action: PayloadAction<{ item: MenuItem; quantity: number; options: CartItemOptions }>) => {
      const { item, quantity, options } = action.payload;

      // Ensure quantity is at least 1
      const validQuantity = Math.max(1, quantity);

      const optionsKey = generateOptionsKey(options);
      const cartItemId = `${item.id}-${optionsKey}`; // Generate unique ID based on item and options

      const existingItemIndex = state.items.findIndex(
        (cartItem) => cartItem.cartItemId === cartItemId
      );

      if (existingItemIndex !== -1) {
        state.items[existingItemIndex].quantity += validQuantity;
      } else {
        state.items.push({
          ...item, 
          cartItemId: cartItemId,
          quantity: validQuantity,
          selectedOptions: options,
        });
      }
    // Open the cart when an item is added
    //   state.isOpen = true;
    },

    // Action to remove an item completely from the cart based on its unique cartItemId
    removeItem: (state, action: PayloadAction<{ cartItemId: string }>) => {
      state.items = state.items.filter(
        (item) => item.cartItemId !== action.payload.cartItemId
      );

    //   if (state.items.length === 0) {
    //     state.isOpen = false;
    //   }
    },
    // Action to increment quantity of a specific cart item
    incrementQuantity: (state, action: PayloadAction<{ cartItemId: string }>) => {
      const item = state.items.find(
        (item) => item.cartItemId === action.payload.cartItemId
      );
      if (item) {
        item.quantity += 1;
      }
    },
    // Action to decrement quantity of a specific cart item
    decrementQuantity: (state, action: PayloadAction<{ cartItemId: string }>) => {
      const itemIndex = state.items.findIndex(
        (item) => item.cartItemId === action.payload.cartItemId
      );
      if (itemIndex !== -1) {
        state.items[itemIndex].quantity -= 1;
        // Remove item if quantity reaches 0
        if (state.items[itemIndex].quantity <= 0) {
          state.items.splice(itemIndex, 1);
        // Close cart if it becomes empty
        //   if (state.items.length === 0) {
        //     state.isOpen = false;
        //   }
        }
      }
    },

    // Action to clear the entire cart
    clearCart: (state) => {
      state.items = [];
      state.isOpen = false; // Close cart when cleared
    },
  },
});

// Export actions
export const {
  openCart,
  closeCart,
  toggleCart,
  addItem,
  removeItem,
  incrementQuantity,
  decrementQuantity,
  clearCart,
} = cartSlice.actions;


// --- Selectors ---

export const selectCartItems = (state: RootState): CartItem[] => state.cart.items;

export const selectIsCartOpen = (state: RootState): boolean => state.cart.isOpen;

export const selectCartLineItemCount = (state: RootState): number => state.cart.items.length;

export const selectCartTotalItemCount = createSelector(
  [selectCartItems],
  (items): number => items.reduce((total, item) => total + item.quantity, 0)
);

export const selectCartSubtotal = createSelector(
    [selectCartItems],
    (items): number => {
      return items.reduce((total, item) => {
        // Calculate price per unit for this specific cart item (base + options)
        const calculatedItemPrice = calculatePriceForItem(item);
        // Add the price for the total quantity of this item to the overall total
        return total + calculatedItemPrice * item.quantity;
      }, 0); // Start total at 0
    }
);


export const selectEstimatedLoyaltyPoints = createSelector(
[selectCartItems],
(items): number => {
    return items.reduce((totalPoints, item) => {
    const itemBasePoints = item.loyaltyPoints || 0;
    return totalPoints + (itemBasePoints * item.quantity);
    }, 0);
}
);


// Export reducer
export default cartSlice.reducer;
