// src/components/admin/menu/CategoryManager.tsx (Example Path)

"use client";

import React, { useState } from 'react';
import type { category } from '@/constants/types'; // Adjust path
import apiClient from '@/lib/apiClient'; // Adjust path

// Icons
const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const DeleteIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const Spinner = () => <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>;


interface CategoryManagerProps {
    categories: category[];
    restaurantId: string;
    onCategoriesUpdate: () => void; // Callback to refetch restaurant info after update
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
    categories,
    restaurantId,
    onCategoriesUpdate
}) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newCategoryName.trim();
        if (!trimmedName || !restaurantId) return;

        // Prevent adding duplicate category names (case-insensitive check)
        if (categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
            setError(`Category "${trimmedName}" already exists.`);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Call backend API to add the category
            await apiClient.post(`admin/restaurants/${restaurantId}/categories`, { name: trimmedName });
            setNewCategoryName(''); // Clear input on success
            onCategoriesUpdate(); // Trigger refetch in parent
        } catch (err: any) {
            console.error("Error adding category:", err);
            setError(err.response?.data?.message || err.message || "Failed to add category.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = async (categoryName: string) => {
        // Find the category to ensure we have the correct name/id if needed later
        const categoryToDelete = categories.find(cat => cat.name === categoryName);
        if (!categoryToDelete) return;

        // IMPORTANT: Add confirmation with warning about menu items
        if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"? ` +
                            `Menu items currently in this category might become uncategorized or hidden. ` +
                            `Consider reassigning items before deleting.`)) {
            return;
        }

        setIsLoading(true); // Indicate loading for delete action
        setError(null);

        try {
            // Call backend API to delete the category
            // This API needs to remove the category from the 'categories' array in RestaurantInfo
            // It might also need to handle updating menu items linked to it (e.g., set categoryId to null or a default) - depends on backend logic
            await apiClient.delete(`admin/restaurants/${restaurantId}/categories/${encodeURIComponent(categoryName)}`); // Pass name as param
            onCategoriesUpdate();
        } catch (err: any) {
             console.error(`Error deleting category "${categoryName}":`, err);
             setError(err.response?.data?.message || err.message || "Failed to delete category.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* List Existing Categories */}
            <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                    <div key={cat.name} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                        <span className="text-gray-800">{cat.name}</span>
                        {/* Prevent deleting 'Popular' or other core categories if needed */}
                        {cat.name.toLowerCase() !== 'popular' && (
                             <button
                                onClick={() => handleDeleteCategory(cat.name)}
                                disabled={isLoading}
                                className="ml-1.5 p-0.5 text-red-400 hover:text-red-600 rounded-full hover:bg-red-100 disabled:opacity-50"
                                title={`Delete category "${cat.name}"`}
                            >
                                <DeleteIcon />
                            </button>
                        )}
                    </div>
                ))}
                {categories.length === 0 && <p className="text-sm text-gray-500">No categories created yet.</p>}
            </div>

            {/* Add New Category Form */}
            <form onSubmit={handleAddCategory} className="flex items-end gap-2 pt-4 border-t">
                <div className="flex-grow">
                    <label htmlFor="newCategoryName" className="block text-xs font-medium text-gray-600 mb-1">
                        New Category Name
                    </label>
                    <input
                        type="text"
                        id="newCategoryName"
                        value={newCategoryName}
                        onChange={(e) => { setNewCategoryName(e.target.value); setError(null); }}
                        placeholder="e.g., Appetizers"
                        required
                        className="input-field-sm" // Use style from SiteInfoForm
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !newCategoryName.trim()}
                    className="button-primary inline-flex items-center !py-1.5 disabled:opacity-50" // Use style from SiteInfoForm
                >
                    {isLoading ? <Spinner /> : <PlusIcon />}
                    <span className="ml-1">Add</span>
                </button>
            </form>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
};

export default CategoryManager;
