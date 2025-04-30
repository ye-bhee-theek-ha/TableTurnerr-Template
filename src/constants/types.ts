import { Timestamp } from "firebase/firestore";


// USER
export interface Address {
  id: string;
  address: string;
  isDefault: boolean;
}


export interface User {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  role?: 'customer' | 'staff' | 'admin';
  phoneNumber?: string | null;
  loyaltyPoints?: number;
  photoURL?: string | null;
  phoneVerified?: boolean; 
  addresses: Address[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null; 
  loading: 'idle' | 'pending' | 'succeeded' | 'failed'; 
  error: string | null; 

  phoneVerificationId: string | null;
  phoneVerificationLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  phoneVerificationError: string | null;

  registrationLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
  registrationError: string | null;

    loginLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
    loginError: string | null;

    logoutLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
    logoutError: string | null;
}

export interface UserState {
  profile: User | null;
  addresses: Address[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null; // Store only the error message string
}

export interface category {
  ids: string[];
  name: string;
};

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// resturant types
export interface RestaurantInfo {
  address: string;
  categories: category[];
  faqs?: FAQItem[];
  
  info: {
    name: string;
    description?: string;
    location?: string;
    OpeningTime?: string;
    contact: {
      email: string;
      phone: string;
    };
    
    openingHours: {
      day: string;
      timing: string;
    }[];

    social: {
      facebook?: string;
      instagram?: string;
    };
  };
}

// Menu Item Types
export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  imageUrl?: string;
  description?: string;
  price?: string;
  loyaltyPoints?: number;
  options: {
    IsExtra: boolean;
    IsRequired: boolean;
    Question: string;
    subtext?: string;

    choices: {
      name: string;
      price: number;
    }[];
  }[]

  tags: string[];
  isAvailable?: boolean;
  
  //app specific
  isFavorite?: boolean;
}

// order object types

export type OrderStatus =
  | 'pending' // Order received, awaiting confirmation
  | 'confirmed' // Restaurant accepted the order
  | 'preparing' // Order is being prepared
  | 'ready_for_pickup' // Order is ready for pickup
  | 'out_for_delivery' // Order is out for delivery
  | 'delivered' // Order completed (delivered)
  | 'completed_pickup' // Order completed (picked up) - Optional distinct status
  | 'cancelled_by_user' // Order cancelled by the user
  | 'rejected_by_restaurant'; // Order rejected by the restaurant
  
export interface Order {
  id: string;
  orderNumber: string | null;
  userId: string;
  restaurantId: string;

  customerInfo: {
    name: string;
    email: string;
    phoneNumber?: string;
  };

  items: OrderItem[];
  subTotal: number;

  discountAmount: number;

  totalAmount: number;

  status: OrderStatus;

  orderType: 'pickup' | 'delivery';

  deliveryAddress: Address | null;

  payment: {
    method: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    transactionId?: string;
  };

  specialInstructions?: string;

  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;

  estimatedCompletionTime?: Timestamp | Date | string | null;
  handledByStaffId?: string;
}


export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  /**
   * Denormalized record of selected options (e.g., size, toppings) for this item at the time of order.
   */
  selectedOptions?: Record<string, any>;
}

//cart types

export interface CartItemOptions {
  [key: string]: string | string[] | number | boolean;
}

export interface CartItem extends MenuItem {
  cartItemId: string; 
  quantity: number;
  selectedOptions: CartItemOptions;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

