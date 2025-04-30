// src/components/admin/menu/MenuItemFormModal.tsx (Example Path)

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import type { MenuItem, FAQItem, CartItemOptions, category } from '@/constants/types'
import Image from 'next/image';

import placeholderImg from '@/../public/Images/Product img 2.png';

// --- Helper Type for Option Choice ---
type MenuItemChoice = MenuItem['options'][0]['choices'][0];

interface OptionChoice extends MenuItemChoice {
    id: string; // Add temp ID for React key prop
}
// --- Helper Type for Option Group ---
interface OptionGroup extends Omit<MenuItem['options'][0], 'choices'> {
    id: string; // Add temp ID for React key prop
    choices: OptionChoice[];
}

// --- Icons ---
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const DeleteIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const Spinner = () => <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>;


interface MenuItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (itemData: Omit<MenuItem, 'id'> | MenuItem) => Promise<boolean>; // Returns true on success
    itemToEdit: MenuItem | null; // null if adding new item
    categories: category[]; // List of available categories
    restaurantId: string; // Needed for potential image upload path
}

const MenuItemFormModal: React.FC<MenuItemFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    itemToEdit,
    categories,
    restaurantId
}) => {
    const isEditing = !!itemToEdit;
    const initialFormData = {
        name: itemToEdit?.name || '',
        description: itemToEdit?.description || '',
        price: itemToEdit?.price || '0.00',
        categoryId: itemToEdit?.categoryId || categories[0]?.name || '', // Default to first category if adding
        tags: itemToEdit?.tags || [],
        options: (itemToEdit?.options ? (Array.isArray(itemToEdit.options) ? itemToEdit.options : [itemToEdit.options]) : []).map(opt => ({
            ...opt,
            id: uuidv4(), // Add temp ID for editing UI
            choices: opt.choices.map(ch => ({ ...ch, id: uuidv4() })) // Add temp ID
        })),
        isAvailable: itemToEdit?.isAvailable !== false, // Default to true if not set or adding
        imageUrl: itemToEdit?.imageUrl || '',
        loyaltyPoints: itemToEdit?.loyaltyPoints || 0,
    };

    const [formData, setFormData] = useState(initialFormData);
    const [tagInput, setTagInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null); // For image upload

    // Reset form when itemToEdit changes (e.g., opening modal for different item)
    useEffect(() => {
        if (itemToEdit) {
             setFormData({
                name: itemToEdit.name || '',
                description: itemToEdit.description || '',
                price: itemToEdit.price || '0.00',
                categoryId: itemToEdit.categoryId || categories[0]?.name || '',
                tags: itemToEdit.tags || [],
                options: (itemToEdit.options ? (Array.isArray(itemToEdit.options) ? itemToEdit.options : [itemToEdit.options]) : []).map(opt => ({
                    ...opt,
                    id: uuidv4(),
                    choices: opt.choices.map(ch => ({ ...ch, id: uuidv4() }))
                })),
                isAvailable: itemToEdit.isAvailable !== false,
                imageUrl: itemToEdit.imageUrl || '',
                loyaltyPoints: itemToEdit.loyaltyPoints || 0,
            });
        } else {
            // Reset for adding new item
            setFormData({ ...initialFormData, categoryId: categories[0]?.name || '' });
        }
         setError(null); // Clear errors when modal opens/changes item
         setIsSaving(false);
    }, [itemToEdit, categories]); // Add categories dependency

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setError(null);

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    // --- Tag Management ---
    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagInput(e.target.value);
    };
    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
         if (('key' in e && e.key === 'Enter') || e.type === 'click') {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag && !formData.tags.includes(newTag)) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
            }
            setTagInput(''); // Clear input
         }
    };
    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
    };
    // --- End Tag Management ---

    // --- Options Management ---
    const addOptionGroup = () => {
        setFormData(prev => ({
            ...prev,
            options: [
                ...prev.options,
                { id: uuidv4(), Question: '', IsRequired: false, IsExtra: false, choices: [{ id: uuidv4(), name: '', price: 0 }] }
            ]
        }));
    };
    const removeOptionGroup = (groupId: string) => {
         setFormData(prev => ({ ...prev, options: prev.options.filter(opt => opt.id !== groupId) }));
    };
    const handleOptionGroupChange = (groupId: string, field: keyof Omit<OptionGroup, 'id' | 'choices'>, value: string | boolean) => {
         setFormData(prev => ({
            ...prev,
            options: prev.options.map(opt => opt.id === groupId ? { ...opt, [field]: value } : opt)
         }));
    };
    const addOptionChoice = (groupId: string) => {
         setFormData(prev => ({
            ...prev,
            options: prev.options.map(opt => opt.id === groupId ? { ...opt, choices: [...opt.choices, { id: uuidv4(), name: '', price: 0 }] } : opt)
         }));
    };
     const removeOptionChoice = (groupId: string, choiceId: string) => {
         setFormData(prev => ({
            ...prev,
            options: prev.options.map(opt => opt.id === groupId ? { ...opt, choices: opt.choices.filter(ch => ch.id !== choiceId) } : opt)
         }));
    };
     const handleOptionChoiceChange = (groupId: string, choiceId: string, field: keyof OptionChoice, value: string | number) => {
          setFormData(prev => ({
            ...prev,
            options: prev.options.map(opt => opt.id === groupId ? {
                ...opt,
                choices: opt.choices.map(ch => ch.id === choiceId ? { ...ch, [field]: field === 'price' ? parseFloat(value as string) || 0 : value } : ch)
            } : opt)
         }));
     };
    // --- End Options Management ---

    // --- Image Upload ---
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
         const file = e.target.files?.[0];
         if (!file || !restaurantId) return;
         setError(null);
         console.log("Image selected:", file.name);
         // TODO: Implement actual upload logic here
         // 1. Get reference to Firebase Storage (e.g., `menu_images/${restaurantId}/${itemToEdit?.id || uuidv4()}-${file.name}`)
         // 2. Use `uploadBytes` or `uploadBytesResumable` from 'firebase/storage' (CLIENT SDK)
         // 3. On successful upload, get the download URL using `getDownloadURL`
         // 4. Update form state: setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
         alert("Image upload simulation: Set fake URL. Implement actual upload.");
         setFormData(prev => ({ ...prev, imageUrl: URL.createObjectURL(file) })); // Temporary preview
    };
    // --- End Image Upload ---


    // --- Form Submission ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!formData.name.trim() || !formData.categoryId) {
            setError("Item Name and Category are required.");
            return;
        }
        if (isNaN(parseFloat(formData.price))) {
             setError("Invalid Price.");
             return;
        }
         // Validate options (e.g., ensure choices have names)
         for (const opt of formData.options) {
             if (!opt.Question.trim()) { setError(`Option group question cannot be empty.`); return; }
             if (opt.choices.length === 0) { setError(`Option group "${opt.Question}" must have at least one choice.`); return; }
             for (const choice of opt.choices) {
                 if (!choice.name.trim()) { setError(`Choice name in "${opt.Question}" cannot be empty.`); return; }
             }
         }


        setIsSaving(true);

        // Prepare data for saving (remove temporary IDs)
        const finalOptions = formData.options.map(({ id, choices, ...restOpt }) => ({
            ...restOpt,
            choices: choices.map(({ id: choiceId, ...restChoice }) => restChoice)
        }));

        const saveData: Omit<MenuItem, 'id'> | MenuItem = {
            ...itemToEdit, // Spread existing item data if editing
            name: formData.name.trim(),
            description: formData.description.trim(),
            price: parseFloat(formData.price).toFixed(2), // Save price as string with 2 decimals
            categoryId: formData.categoryId,
            tags: formData.tags.map(t => t.trim()).filter(t => t), // Trim and remove empty tags
            options: finalOptions,
            isAvailable: formData.isAvailable,
            imageUrl: formData.imageUrl, // Use the URL from state (should be updated by upload)
            loyaltyPoints: formData.loyaltyPoints || 0,
            // Add id only if editing
            ...(isEditing && itemToEdit && { id: itemToEdit.id }),
        };

        const success = await onSave(saveData); // Call parent save function

        setIsSaving(false);
        if (!success) {
            // Error should be handled/shown by onSave or set here
             setError(error || "Failed to save menu item."); // Keep existing error or set generic one
        }
        // onClose() will be called by parent if save is successful
    };
    // --- End Form Submission ---


    // --- Render Logic ---
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <motion.div
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
                    <h2 className="text-lg font-semibold">{isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close"><CloseIcon /></button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-grow">

                    {/* Basic Info Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Name */}
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="label-style">Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="input-field" />
                        </div>
                        {/* Price */}
                        <div>
                             <label htmlFor="price" className="label-style">Price ($)</label>
                             <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" className="input-field" />
                        </div>
                    </div>

                     {/* Category & Availability Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category */}
                        <div>
                            <label htmlFor="categoryId" className="label-style">Category</label>
                            <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} required className="input-field bg-white">
                                <option value="" disabled>Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.name || cat.name} value={cat.name || cat.name}>{cat.name}</option> // Use ID if available
                                ))}
                            </select>
                        </div>
                        {/* Availability */}
                         <div className="flex items-center pt-6">
                             <input type="checkbox" id="isAvailable" name="isAvailable" checked={formData.isAvailable} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                             <label htmlFor="isAvailable" className="ml-2 block text-sm font-medium text-gray-700">Item is Available</label>
                         </div>
                    </div>


                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="label-style">Description</label>
                        <textarea id="description" name="description" rows={2} value={formData.description} onChange={handleChange} className="input-field" />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="label-style">Image</label>
                        <div className="flex items-center gap-4 mt-1">
                             <Image
                                src={formData.imageUrl || placeholderImg}
                                alt="Menu item preview"
                                width={64} height={64}
                                className="object-cover rounded border bg-gray-100"
                                onError={(e) => { e.currentTarget.src = placeholderImg.src; }}
                             />
                             <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                        </div>
                         {/* Display current URL if editing */}
                         {isEditing && formData.imageUrl && <p className='text-xs text-gray-400 mt-1 truncate'>Current URL: {formData.imageUrl}</p>}
                    </div>

                    {/* Tags */}
                    <div>
                        <label htmlFor="tagInput" className="label-style">Tags</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                id="tagInput"
                                value={tagInput}
                                onChange={handleTagInputChange}
                                onKeyDown={handleAddTag}
                                placeholder="Add a tag and press Enter"
                                className="input-field flex-grow"
                            />
                             <button type="button" onClick={handleAddTag} className="button-secondary text-xs !py-1.5">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {formData.tags.map(tag => (
                                <span key={tag} className="flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                    {tag}
                                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1.5 text-blue-600 hover:text-blue-800">&times;</button>
                                </span>
                            ))}
                        </div>
                    </div>

                     {/* Loyalty Points */}
                     <div>
                         <label htmlFor="loyaltyPoints" className="label-style">Loyalty Points Earned</label>
                         <input type="number" id="loyaltyPoints" name="loyaltyPoints" value={formData.loyaltyPoints} onChange={handleChange} min="0" step="1" className="input-field w-24" />
                     </div>

                    {/* Options Section */}
                    <fieldset className="border p-3 rounded-md space-y-3">
                        <legend className="text-sm font-medium text-gray-600 px-1">Customization Options</legend>
                        {formData.options.map((opt, optIndex) => (
                            <div key={opt.id} className="border rounded p-2 bg-gray-50/50 relative">
                                <button type="button" onClick={() => removeOptionGroup(opt.id)} className="absolute top-1 right-1 p-0.5 text-red-400 hover:text-red-600" aria-label="Remove Option Group"><DeleteIcon/></button>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2'>
                                    <div>
                                        <label className="label-style-xs">Question</label>
                                        <input type="text" value={opt.Question} onChange={(e) => handleOptionGroupChange(opt.id, 'Question', e.target.value)} placeholder="e.g., Size" required className="input-field-xs" />
                                    </div>
                                    <div className='flex items-end gap-4 pb-1'>
                                         <div className="flex items-center">
                                            <input type="checkbox" id={`isrequired-${opt.id}`} checked={opt.IsRequired} onChange={(e) => handleOptionGroupChange(opt.id, 'IsRequired', e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"/>
                                            <label htmlFor={`isrequired-${opt.id}`} className="ml-2 text-xs font-medium text-gray-700">Required?</label>
                                        </div>
                                         <div className="flex items-center">
                                            <input type="checkbox" id={`isextra-${opt.id}`} checked={opt.IsExtra} onChange={(e) => handleOptionGroupChange(opt.id, 'IsExtra', e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"/>
                                            <label htmlFor={`isextra-${opt.id}`} className="ml-2 text-xs font-medium text-gray-700">Is Extra (Multi-select)?</label>
                                        </div>
                                    </div>
                                </div>
                                <label className="label-style-xs mt-1">Choices</label>
                                <div className='space-y-1.5'>
                                {opt.choices.map((choice, choiceIndex) => (
                                    <div key={choice.id} className="flex items-center gap-2">
                                        <input type="text" value={choice.name} onChange={(e) => handleOptionChoiceChange(opt.id, choice.id, 'name', e.target.value)} placeholder="Choice Name" required className="input-field-xs flex-1"/>
                                        <input type="number" value={choice.price} onChange={(e) => handleOptionChoiceChange(opt.id, choice.id, 'price', e.target.value)} placeholder="Price (e.g., 1.50)" min="0" step="0.01" className="input-field-xs w-24"/>
                                        <button type="button" onClick={() => removeOptionChoice(opt.id, choice.id)} className="p-0.5 text-red-400 hover:text-red-600 flex-shrink-0" aria-label="Remove Choice"><DeleteIcon/></button>
                                    </div>
                                ))}
                                </div>
                                <button type="button" onClick={() => addOptionChoice(opt.id)} className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"><PlusIcon/> Add Choice</button>
                            </div>
                        ))}
                         <button type="button" onClick={addOptionGroup} className="mt-3 text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"><PlusIcon/> Add Option Group</button>
                    </fieldset>

                    {/* Error Display */}
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                </form>

                 {/* Footer Actions */}
                <div className="flex justify-end items-center gap-4 p-4 border-t bg-gray-50 flex-shrink-0">
                    <button type="button" onClick={onClose} className="button-secondary">Cancel</button>
                    <button
                        type="submit" // Connects to the form's onSubmit
                        form="menuItemForm" // Associate with form if needed, though usually implicit
                        disabled={isSaving}
                        className="button-primary inline-flex items-center disabled:opacity-50"
                    >
                        {isSaving && <Spinner />}
                        {isEditing ? 'Save Changes' : 'Add Item'}
                    </button>
                </div>

                {/* Reusable input/button styles */}
                <style jsx global>{`
                    .label-style { @apply block text-sm font-medium text-gray-700 mb-1; }
                    .label-style-xs { @apply block text-xs font-medium text-gray-600 mb-0.5; }
                    .input-field { @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary; }
                    .input-field-sm { @apply w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm; }
                    .input-field-xs { @apply w-full px-2 py-1 border border-gray-300 rounded text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary; }
                    .button-primary { @apply px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary; }
                    .button-secondary { @apply px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400; }
                `}</style>
            </motion.div>
        </div>
    );
};

export default MenuItemFormModal;
