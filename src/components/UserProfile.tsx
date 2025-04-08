"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import defaultProfile from "@/../public/Svgs/profile.svg";
import useUser from "@/hooks/useUser";
import { motion, AnimatePresence } from "framer-motion";
import { Address } from "@/constants/types";
import { useAuth } from "@/hooks/useAuth";
import { deleteUserAddress } from "@/lib/slices/userSlice";

// Types for user data
interface UserProfileModalProps {
  onClose: () => void;
  onEditProfile: () => void;
  onManageAddresses: () => void;
  onSignOut: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  onClose,
  onEditProfile,
  onManageAddresses,
  onSignOut,
}) => {
  const { profile, addresses, isLoading } = useUser();
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Get default address
  const defaultAddress = addresses?.find(addr => addr.isDefault) || addresses?.[0];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-80 sm:w-96 shadow-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <motion.div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-80 sm:w-96 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header with close button */}
        <div className="flex justify-between items-center p-4">
          <h2 className="text-lg font-semibold">Your Profile</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-primary transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Divider line */}
        <div className="w-[90%] h-0.5 rounded-full mx-auto bg-primary" />

        {/* Profile content */}
        <div className="p-4">
          {/* Profile image and name */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 mb-3 border-2 border-primary cursor-pointer">
                <Image 
                  src={profile?.photoURL || defaultProfile} 
                  alt="Profile" 
                  width={96} 
                  height={96}
                  className="object-cover h-full w-full"
                />
              </div>
              <div className="h-24 w-24 absolute inset-0 bg-black/50 bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100">
                <button 
                  className="bg-white/60 rounded-full p-1"
                  aria-label="Change profile picture"
                  onClick={onEditProfile}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <h3 className="text-h5 font-bold text-gray-800">
              {profile?.displayName || "Your Name"}
            </h3>
            
            <div className="text-normal3 text-gray-500 mt-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {profile?.email}
            </div>
          </div>
          
          {/* Contact info section */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Contact Information
            </h4>
            
            <div className="space-y-3">
              {profile?.phoneNumber ? (
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="text-gray-700">{profile.phoneNumber}</p>
                    <p className="text-xs text-gray-500">Phone</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="text-gray-500 italic">No phone number added</p>
                    <button 
                      className="text-xs text-primary hover:text-primary-dark"
                      onClick={onEditProfile}
                    >
                      Add phone number
                    </button>
                  </div>
                </div>
              )}
              
              {defaultAddress ? (
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-gray-700">
                      {defaultAddress.address}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center">
                      {defaultAddress.isDefault && (
                        <span className="bg-primary-dark/15 text-primary text-xs px-2 py-0.5 rounded mr-2">
                          Default
                        </span>
                      )}
                      {/* {defaultAddress.country} */}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-gray-500 italic">No address added</p>
                    <button 
                      className="text-xs text-primary hover:text-primary-dark"
                      onClick={onManageAddresses}
                    >
                      Add address
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Account actions */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Account Actions
            </h4>
            
            <div className="space-y-2">
              <button 
                onClick={onEditProfile}
                className="flex items-center w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
              
              <button 
                onClick={onManageAddresses}
                className="flex items-center w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Manage Addresses
              </button>
              
              <button 
                onClick={onSignOut}
                className="flex items-center w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Profile Button Component
const ProfileButton: React.FC<{
    profile: any | null;
    onClick: () => void;
  }> = ({ profile, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center space-x-2 relative group"
      aria-label="User profile"
    >
      <div className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200 group-hover:border-primary transition-colors">
        <Image
          src={profile?.photoURL || defaultProfile}
          alt="Profile"
          width={40}
          height={40}
          className="object-cover h-[80%] w-[80%]"
        />
      </div>
      <div className="hidden md:block text-left">
        <p className="text-normal3 font-medium text-gray-800 truncate max-w-[120px]">
          {profile?.displayName || "Guest"}
        </p>
        <p className="text-xs text-gray-500 truncate max-w-[120px]">
          {profile?.email || "Sign in"}
        </p>
      </div>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors hidden md:block" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

// Edit Profile Modal Component
interface EditProfileModalProps {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose, onSave }) => {
  const { profile, isLoading } = useUser();
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || "",
    phoneNumber: profile?.phoneNumber || "",
    photoURL: profile?.photoURL || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Handle file uploads - in a real app you'd upload to storage
    // and get a URL back. For simplicity, here we just simulate it.
    const file = e.target.files?.[0];
    if (file) {
      // This would be an image upload to cloud storage in a real app
      // For demo purposes, create a fake URL
      const fakeUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, photoURL: fakeUrl }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
      // Show error message to user
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <motion.div 
        className="bg-white rounded-lg shadow-xl w-80 sm:w-96 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Edit Profile</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {/* Profile image upload */}
          <div className="flex flex-col items-center mb-6">
            <div 
              className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 mb-3 border-2 border-primary cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image 
                src={formData.photoURL || defaultProfile} 
                alt="Profile" 
                width={96} 
                height={96}
                className="object-cover h-full w-full"
              />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
            <button 
              type="button" 
              className="text-sm text-primary  hover:text-primary-dark transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              Change profile picture
            </button>
          </div>
          
          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
            
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+1 (123) 456-7890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: +[country code][number] (e.g., +12345678900)
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Address Management Modal Component
interface AddressManagementModalProps {
  onClose: () => void;
  onSave: (address: Partial<Address>) => Promise<void>;
  onDelete: (addressId: string) => Promise<void>;
  onSetDefault: (addressId: string) => Promise<void>;
}

const AddressManagementModal: React.FC<AddressManagementModalProps> = ({
  onClose,
  onSave,
  onDelete,
  onSetDefault
}) => {
  const { addresses } = useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Partial<Address> | null>(null);
  const [formData, setFormData] = useState<Partial<Address>>({
    address: "",
    // city: "",
    // state: "",
    // zipCode: "",
    // country: "",
    isDefault: false
  });
  const [isSaving, setIsSaving] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };
  
  const resetForm = () => {
    setFormData({
      address: "",
      // city: "",
      // state: "",
      // zipCode: "",
      // country: "",
      isDefault: false
    });
    setEditingAddress(null);
  };
  
  const handleEdit = (address: Address) => {
    console.log("editing addr:",address)
    setFormData({...address});
    setEditingAddress(address);
    setShowAddForm(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Make sure the ID is properly passed for updates
      if (editingAddress?.id) {
        await onSave({
          ...formData,
          id: editingAddress.id
        }
      );
      } else {
        // New address
        await onSave(formData);
      }
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error saving address:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async (addressId: string) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        await onDelete(addressId);
      } catch (error) {
        console.error("Error deleting address:", error);
      }
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <motion.div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Manage Addresses</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {showAddForm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-medium text-gray-900">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </h3>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              {/* <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Zip/Postal Code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div> */}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                  Set as default address
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowAddForm(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:bg-primary-dark/50"
                >
                  {isSaving ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          ) : (
            <>
              {addresses && addresses.length > 0 ? (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div 
                      key={address.id} 
                      className="border rounded-md p-3 relative hover:border-primary transition-colors"
                    >
                      <div className="flex flex-col justify-between">
                        <div>
                          <p className="font-medium text-gray-800">
                            {address.address}
                          </p>
                          <p className="text-sm text-gray-600">
                            {/* {address.city}, {address.state} {address.zipCode} */}
                          </p>
                          <p className="text-sm text-gray-600">
                            {/* {address.country} */}
                          </p>
                        </div>
                        
                        <div className="flex flex-row space-x-2 items-center justify-between">
                          <div>
                            {address.isDefault && (
                                <span className="inline-block  bg-primary/5 text-primary text-xs px-2 py-0.5 rounded">
                                  Default Address
                                </span>
                            )}
                          </div>
                          
                          <div className="flex items-center">
                            <button 
                              onClick={() => handleEdit(address)}
                              className="text-gray-500 hover:text-primary"
                              aria-label="Edit address"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            
                            <button 
                              onClick={() => handleDelete(address.id)}
                              className="text-gray-500 hover:text-red-500"
                              aria-label="Delete address"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            
                            {!address.isDefault && (
                              <button 
                                onClick={() => onSetDefault(address.id)}
                                className="text-gray-500 hover:text-primary"
                                aria-label="Set as default address"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                          </div>
                         
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="mt-2 text-gray-500">You have no saved addresses</p>
                </div>
              )}
              
              <div className="mt-4">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Address
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Main User Profile Component
const UserProfile: React.FC = () => {
  const { profile, updateAddress, addAddress, updateProfile, deleteAddress, setDefaultAddress } = useUser();
  const {logout} = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  
  const handleSaveProfile = async (data: any) => {
    try {
      await updateProfile(data);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };
  
  const handleSaveAddress = async (address: Partial<Address>) => {
    try {
      if (address.address) {
        if (address.id) {
          // updating address
          await updateAddress(address as Address);
        } else {
          await addAddress(address as Omit<Address, "id">);
        }
      } else {
        throw new Error("Address is required.");
      }
    } catch (error) {
      console.error("Error adding/updating address:", error);
      throw error;
    }
  };
  
  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteAddress(addressId);
    } catch (error) {
      console.error("Error deleting address:", error);
      throw error;
    }
  };
  
  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId);
    } catch (error) {
      console.error("Error setting default address:", error);
      throw error;
    }
  };
  
  const handleSignOut = async () => {
    try {
      await logout();
      setIsProfileModalOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  return (
    <>
      <ProfileButton 
        profile={profile} 
        onClick={() => setIsProfileModalOpen(true)} 
      />
      
      <AnimatePresence>
        {isProfileModalOpen && (
          <UserProfileModal
            onClose={() => setIsProfileModalOpen(false)}
            onEditProfile={() => {
              setIsProfileModalOpen(false);
              setIsEditProfileModalOpen(true);
            }}
            onManageAddresses={() => {
              setIsProfileModalOpen(false);
              setIsAddressModalOpen(true);
            }}
            onSignOut={handleSignOut}
          />
        )}
        
        {isEditProfileModalOpen && (
          <EditProfileModal
            onClose={() => setIsEditProfileModalOpen(false)}
            onSave={handleSaveProfile}
          />
        )}
        
        {isAddressModalOpen && (
          <AddressManagementModal
            onClose={() => setIsAddressModalOpen(false)}
            onSave={handleSaveAddress}
            onDelete={handleDeleteAddress}
            onSetDefault={handleSetDefaultAddress}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default UserProfile;