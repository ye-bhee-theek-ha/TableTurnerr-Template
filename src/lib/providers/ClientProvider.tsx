// client provider

"use client";

import React, { useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store, AppDispatch } from "../store/store";
import {
  fetchInitialRestaurantData,
  fetchAllMenuItemsFromApi,
  selectHasLoadedInitialData,
  selectHasLoadedAllItems,
  selectRestaurantLoadingState
} from "../slices/restaurantSlice";
import { checkAuthStatus } from "../slices/authSlice";

const ReduxInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();

  const { initial: initialLoadingStatus, allItems: allItemsLoadingStatus } = useSelector(selectRestaurantLoadingState);
  const hasLoadedInitial = useSelector(selectHasLoadedInitialData);

  useEffect(() => {
    dispatch(checkAuthStatus());
    if (initialLoadingStatus === 'idle') {
      console.log("ReduxInitializer: Dispatching fetchInitialRestaurantData.");
      dispatch(fetchInitialRestaurantData());
  }
  }, [dispatch, initialLoadingStatus]);

  useEffect(() => {

    if (hasLoadedInitial && allItemsLoadingStatus === 'idle') {
        dispatch(fetchAllMenuItemsFromApi());
    }
  }, [dispatch, hasLoadedInitial, allItemsLoadingStatus]);

  return <>{children}</>;
};

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
  <Provider store={store}>
    <ReduxInitializer>
      {children}
    </ReduxInitializer>
  </Provider>
  )
  
}