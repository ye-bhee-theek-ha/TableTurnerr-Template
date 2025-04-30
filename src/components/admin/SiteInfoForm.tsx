// src/components/admin/SiteInfoForm.tsx (Example Path)

"use client";

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid'; // For unique keys if needed for hours

import { RootState, AppDispatch } from '@/lib/store/store'; // Adjust path
import { selectRestaurantInfo, fetchInitialRestaurantData } from '@/lib/slices/restaurantSlice';
import apiClient from '@/lib/apiClient'; // Adjust path
// Ensure all necessary types are imported
import type { RestaurantInfo, FAQItem } from '@/constants/types'; // Adjust path

// Define more specific types for the form data based on RestaurantInfo['info']
// Initialize with default structures to avoid undefined issues
type InfoFormData = {
    name: string;
    description: string;
    location: string; // URL
    contact: {
        email: string;
        phone: string;
    };
    openingHours: { day: string; timing: string; id: string }[]; // Add unique id for mapping/editing
    social: { // Using object structure for easier access
        facebook: string;
        instagram: string;
        // Add other platforms here
    };
    OpeningTime?: string;
};

// Default empty state structure matching InfoFormData
const defaultFormData: InfoFormData = {
    name: '',
    description: '',
    location: '',
    contact: { email: '', phone: '' },
    openingHours: [],
    social: { facebook: '', instagram: '' },
};

const SiteInfoForm: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const restaurantInfo = useSelector(selectRestaurantInfo);
    const isLoadingInfo = useSelector((state: RootState) => state.restaurant.loading.initial === 'pending');
    const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

    // Use the more specific type and default state
    const [formData, setFormData] = useState<InfoFormData>(defaultFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Initialize form data when restaurantInfo loads
    useEffect(() => {
        if (restaurantInfo?.info) {
            // Map opening hours to include a temporary unique ID for React keys/editing
            const hoursWithIds = (restaurantInfo.info.openingHours || []).map(h => ({
                ...h,
                id: uuidv4() // Assign a temporary unique ID for list rendering
            }));

            // Handle social links (assuming object structure now)
            let socialData = { facebook: '', instagram: '' };
            if (Array.isArray(restaurantInfo.info.social) && restaurantInfo.info.social.length > 0) {
                 // If it's still an array in the data, try to convert the first element
                 socialData = {
                    facebook: restaurantInfo.info.social[0]?.facebook || '',
                    instagram: restaurantInfo.info.social[0]?.instagram || '',
                 };
            } else if (typeof restaurantInfo.info.social === 'object' && restaurantInfo.info.social !== null && !Array.isArray(restaurantInfo.info.social)) {
                 // If it's already an object (preferred)
                 socialData = {
                     facebook: (restaurantInfo.info.social as any).facebook || '',
                     instagram: (restaurantInfo.info.social as any).instagram || '',
                 }
            }


            setFormData({
                name: restaurantInfo.info.name || '',
                description: restaurantInfo.info.description || '',
                location: restaurantInfo.info.location || '',
                contact: {
                    email: restaurantInfo.info.contact?.email || '',
                    phone: restaurantInfo.info.contact?.phone || '',
                },
                openingHours: hoursWithIds,
                social: socialData,
            });
        } else if (!isLoadingInfo && !restaurantInfo) {
            dispatch(fetchInitialRestaurantData());
        }
    }, [restaurantInfo, isLoadingInfo, dispatch]);

    // --- Handlers for Input Changes ---

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setError(null); setSuccessMessage(null);

        if (name.startsWith('contact.')) {
            const contactField = name.split('.')[1] as keyof InfoFormData['contact'];
            setFormData(prev => ({
                ...prev,
                contact: { ...prev.contact, [contactField]: value },
            }));
        } else if (name.startsWith('social.')) {
            const socialField = name.split('.')[1] as keyof InfoFormData['social'];
             setFormData(prev => ({
                ...prev,
                social: { ...prev.social, [socialField]: value },
            }));
        }
         else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleOpeningHoursChange = (id: string, field: 'day' | 'timing', value: string) => {
        setError(null); setSuccessMessage(null);
        setFormData(prev => ({
            ...prev,
            openingHours: prev.openingHours.map(hour =>
                hour.id === id ? { ...hour, [field]: value } : hour
            ),
        }));
    };

    const addOpeningHour = () => {
        setError(null); setSuccessMessage(null);
        setFormData(prev => ({
            ...prev,
            openingHours: [...prev.openingHours, { id: uuidv4(), day: '', timing: '' }],
        }));
    };

    const removeOpeningHour = (id: string) => {
        setError(null); setSuccessMessage(null);
        setFormData(prev => ({
            ...prev,
            openingHours: prev.openingHours.filter(hour => hour.id !== id),
        }));
    };

    // --- Handle Form Submission ---

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurantId) { setError("Restaurant ID not configured."); return; }
        setIsSaving(true); setError(null); setSuccessMessage(null);

        try {
            // Prepare data, removing temporary IDs from openingHours
            const dataToSave: RestaurantInfo['info'] = {
                name: formData.name,
                description: formData.description,
                location: formData.location,
                contact: formData.contact,
                openingHours: formData.openingHours.map(({ id, ...rest }) => rest),
                social: formData.social,
            };

            await apiClient.put(`/admin/restaurants/${restaurantId}/info`, dataToSave);
            setSuccessMessage("Restaurant information updated successfully!");
            // Optionally re-fetch data to confirm update and get fresh state
            // dispatch(fetchInitialRestaurantData());
        } catch (err: any) {
            console.error("Error updating site info:", err);
            setError(err.response?.data?.message || err.message || "Failed to update information.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Render Logic ---

    if (isLoadingInfo && !restaurantInfo?.info) {
        return <div className="text-center p-4">Loading restaurant info...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} required className="input-field" />
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea id="description" name="description" rows={3} value={formData.description || ''} onChange={handleChange} className="input-field" />
            </div>

             {/* Location URL */}
             <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location URL (Google Maps)</label>
                <input type="text" id="location" name="location" value={formData.location || ''} onChange={handleChange} placeholder="https://maps.google.com/..." className="input-field" />
            </div>

            {/* Contact Info */}
            <fieldset className="border p-4 rounded-md">
                 <legend className="text-sm font-medium text-gray-600 px-1">Contact</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <label htmlFor="contact.email" className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                        <input type="email" id="contact.email" name="contact.email" value={formData.contact?.email || ''} onChange={handleChange} required className="input-field-sm" />
                    </div>
                    <div>
                        <label htmlFor="contact.phone" className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                        <input type="tel" id="contact.phone" name="contact.phone" value={formData.contact?.phone || ''} onChange={handleChange} required className="input-field-sm" />
                    </div>
                </div>
            </fieldset>

            {/* Opening Hours */}
            <fieldset className="border p-4 rounded-md">
                 <legend className="text-sm font-medium text-gray-600 px-1">Opening Hours</legend>
                 <div className="space-y-3 mt-2">
                    {formData.openingHours.map((hour, index) => (
                        <div key={hour.id} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={hour.day}
                                onChange={(e) => handleOpeningHoursChange(hour.id, 'day', e.target.value)}
                                placeholder="Day(s) (e.g., Mon-Fri)"
                                className="input-field-sm flex-1"
                            />
                            <input
                                type="text"
                                value={hour.timing}
                                onChange={(e) => handleOpeningHoursChange(hour.id, 'timing', e.target.value)}
                                placeholder="Timing (e.g., 9am - 5pm)"
                                className="input-field-sm flex-1"
                            />
                            <button
                                type="button"
                                onClick={() => removeOpeningHour(hour.id)}
                                className="p-1 text-red-500 hover:text-red-700 flex-shrink-0"
                                aria-label="Remove opening hour"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    ))}
                 </div>
                 <button
                    type="button"
                    onClick={addOpeningHour}
                    className="mt-3 flex items-center gap-1 text-sm text-primary hover:text-primary-dark font-medium"
                 >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Add Hours
                 </button>
            </fieldset>

            {/* Social Links */}
             <fieldset className="border p-4 rounded-md">
                 <legend className="text-sm font-medium text-gray-600 px-1">Social Media</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <label htmlFor="social.facebook" className="block text-xs font-medium text-gray-600 mb-1">Facebook URL</label>
                        <input type="url" id="social.facebook" name="social.facebook" value={formData.social?.facebook || ''} onChange={handleChange} placeholder="https://facebook.com/..." className="input-field-sm" />
                    </div>
                     <div>
                        <label htmlFor="social.instagram" className="block text-xs font-medium text-gray-600 mb-1">Instagram URL</label>
                        <input type="url" id="social.instagram" name="social.instagram" value={formData.social?.instagram || ''} onChange={handleChange} placeholder="https://instagram.com/..." className="input-field-sm" />
                    </div>
                    {/* Add more social inputs here */}
                 </div>
            </fieldset>


            {/* Save Button & Messages */}
            <div className="flex justify-end items-center gap-4 pt-4 border-t mt-6">
                 {error && <p className="text-sm text-red-600">{error}</p>}
                 {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
                <motion.button
                    type="submit"
                    disabled={isSaving || isLoadingInfo}
                    className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-wait"
                    whileHover={{ scale: isSaving ? 1 : 1.03 }}
                    whileTap={{ scale: isSaving ? 1 : 0.98 }}
                >
                    {isSaving ? (
                        <>
                         <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                         Saving...
                        </>
                    ) : "Save Info"}
                </motion.button>
            </div>

            {/* Simple reusable input styles */}
            <style jsx global>{`
                .input-field {
                    @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary;
                }
                .input-field-sm {
                     @apply w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm;
                }
            `}</style>
        </form>
    );
};

export default SiteInfoForm;
