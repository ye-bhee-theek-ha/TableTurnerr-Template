// client provider

"use client";

import React, { useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store, AppDispatch } from "../store/store";
import { getAllMenuItems, getRestaurantData, selectLoadingPriority } from "../slices/restaurantSlice";
import { checkAuthStatus } from "../slices/authSlice";

const ReduxInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const loadingPriority = useSelector(selectLoadingPriority);

  useEffect(() => {
    dispatch(checkAuthStatus());
    dispatch(getRestaurantData());
  }, [dispatch]);

  useEffect(() => {
    // Once restaurant data is loaded, fetch all menu items
    if (loadingPriority === 'allItems') {

      console.log("Loading all menu items... after restaurant data loaded");
      dispatch(getAllMenuItems());
    }
  }, [loadingPriority, dispatch]);

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