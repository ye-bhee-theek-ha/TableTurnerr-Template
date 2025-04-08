import { useEffect, useCallback, useRef } from 'react'; // Import useRef
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store/store'; // Adjust path if needed
import {
  fetchUserProfile,
  fetchUserAddresses,
  updateUserProfile,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  clearUserError,
} from '@/lib/slices/userSlice';
import { Address, User } from '@/constants/types'; // Assuming User type is also needed or defined elsewhere

export const useUser = () => {
  const dispatch = useDispatch<AppDispatch>();
  // Select state from the user slice
  const { profile, addresses, loading, error } = useSelector(
    (state: RootState) => state.user
  );
  // Select auth state to know if user is logged in
  const { isAuthenticated, user: authUser } = useSelector(
    (state: RootState) => state.auth
  );

  // Ref to track if the initial fetch attempt has been made for addresses
  const initialAddressFetchAttempted = useRef(false);

  // Fetch profile and addresses when authenticated user is available and data isn't loaded
  useEffect(() => {
    const currentAddresses = Array.isArray(addresses) ? addresses : [];
    const hasAddresses = currentAddresses.length > 0;
    const isLoading = loading === 'pending';
    // Check if the fetch has succeeded previously (even if result was empty array)
    // We infer this by checking if loading is 'succeeded' OR if it's 'idle'/'failed' but we already attempted the fetch
    const fetchSucceededOrAttempted = loading === 'succeeded' || (initialAddressFetchAttempted.current && (loading === 'idle' || loading === 'failed'));


    // --- Profile Fetch Logic ---
    // Fetch profile if authenticated, not loading, and profile is missing
    if (isAuthenticated && !profile && loading !== 'pending' && loading !== 'succeeded') {
        console.log('useUser: Fetching user profile...');
        dispatch(fetchUserProfile());
    }

    // --- Address Fetch Logic ---
    // **FIX:** Fetch addresses ONLY if:
    // 1. User is authenticated
    // 2. We are NOT currently loading
    // 3. We haven't successfully fetched or already attempted the fetch
    if (isAuthenticated && !isLoading && !fetchSucceededOrAttempted) {
        console.log('useUser: Attempting initial fetch for user addresses...');
        initialAddressFetchAttempted.current = true; // Mark that we are attempting the fetch
        dispatch(fetchUserAddresses());
    }

    // Dependencies: run when auth status changes or loading state changes.
    // Addresses array itself is not strictly needed if we rely on loading state and the ref.
  }, [dispatch, isAuthenticated, profile, loading]); // Removed addresses from deps, added loading

  // Reset fetch attempt ref if user logs out/logs in
  useEffect(() => {
      if (!isAuthenticated) {
          initialAddressFetchAttempted.current = false;
      }
  }, [isAuthenticated]);


  // --- Action Dispatchers ---

  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    if (profileData) {
        await dispatch(updateUserProfile(profileData)).unwrap();
    } else {
        console.error("Profile data is null or undefined.");
    }
  }, [dispatch]);

  const addAddress = useCallback(async (addressData: Omit<Address, 'id'>) => {
    await dispatch(addUserAddress(addressData)).unwrap();
  }, [dispatch]);

  const updateAddress = useCallback(async (addressData: Address) => {
    await dispatch(updateUserAddress(addressData)).unwrap();
  }, [dispatch]);

  const deleteAddress = useCallback(async (addressId: string) => {
    await dispatch(deleteUserAddress(addressId)).unwrap();
  }, [dispatch]);

  // Function to set an address as default
  const setDefaultAddress = useCallback(async (addressId: string) => {
    const currentAddresses = Array.isArray(addresses) ? addresses : [];
    const targetAddress = currentAddresses.find(addr => addr.id === addressId);
    if (!targetAddress) {
        console.error("Address not found in state:", addressId);
        throw new Error("Address not found");
    }
    await dispatch(updateUserAddress({ ...targetAddress, isDefault: true })).unwrap();
  }, [dispatch, addresses]);

  const refetchProfile = useCallback(() => {
      if (isAuthenticated) dispatch(fetchUserProfile());
  }, [dispatch, isAuthenticated]);

  const refetchAddresses = useCallback(() => {
      // Reset the attempt flag before refetching
      initialAddressFetchAttempted.current = false;
      if (isAuthenticated) dispatch(fetchUserAddresses());
  }, [dispatch, isAuthenticated]);

  // Function to clear error message
  const clearUserErrorMessage = useCallback(() => {
    dispatch(clearUserError());
  }, [dispatch]);

  // --- Derived State ---
  const defaultAddress = Array.isArray(addresses)
    ? addresses.find(addr => addr.isDefault) || null
    : null;

  // Determine overall loading state (consider profile and addresses)
  // This logic might need refinement based on how you want to display loading
  const isOverallLoading = loading === 'pending' || (isAuthenticated && !profile && loading !== 'failed'); // Example: Loading if pending OR if auth but no profile yet (and not failed)


  return {
    profile,
    addresses: Array.isArray(addresses) ? addresses : [],
    defaultAddress,
    isLoading: isOverallLoading,
    error,
    isAuthenticated,
    userId: authUser?.uid,

    // Action functions
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    clearUserErrorMessage,
    refetchProfile,
    refetchAddresses,
  };
};

export default useUser;
