

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
  role?: 'customer' | 'employee' | 'admin';
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

// resturant types
export interface RestaurantInfo {
  address: string;

  catagories: {
    ids: string[];
    name: string;
  }[];

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
    }[];
  };
}

// Menu Item Types

export interface MenuItem {
  id: string;
  
  name: string;
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

  // app specific
  isFavorite?: boolean;
}


