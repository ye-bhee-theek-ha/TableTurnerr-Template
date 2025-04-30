// src/components/admin/FaqManager.tsx (Example Path)

"use client";

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

import { RootState, AppDispatch } from '@/lib/store/store';
import {
    updateFaqsLocally,
} from '@/lib/slices/restaurantSlice'; 
import apiClient from '@/lib/apiClient';
import type { FAQItem } from '@/constants/types';
// Simple Icons
const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const EditIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const DeleteIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const SaveIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const CancelIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;


const FaqManager: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const initialFaqs = useSelector(((state:RootState) => state.restaurant.info?.faqs)); // Get initial FAQs from Redux store
    const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null); // ID of FAQ being edited
    const [editData, setEditData] = useState<{ question: string; answer: string }>({ question: '', answer: '' });
    const [isAdding, setIsAdding] = useState(false); // State for showing add form
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Initialize local state with data from Redux store
    useEffect(() => {
        // Deep copy to prevent direct mutation of Redux state
        setFaqs(initialFaqs ? JSON.parse(JSON.stringify(initialFaqs)) : []);
    }, [initialFaqs]);

    const handleAddClick = () => {
        setEditingId(null); // Ensure not editing
        setEditData({ question: '', answer: '' }); // Clear form
        setIsAdding(true); // Show the add form
        setError(null);
        setSuccessMessage(null);
    };

    const handleEditClick = (faq: FAQItem) => {
        setIsAdding(false); // Ensure add form is hidden
        setEditingId(faq.id);
        setEditData({ question: faq.question, answer: faq.answer });
        setError(null);
        setSuccessMessage(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setIsAdding(false);
        setEditData({ question: '', answer: '' });
        setError(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = (idToSave: string) => {
        if (!editData.question.trim() || !editData.answer.trim()) {
            setError("Question and Answer cannot be empty.");
            return;
        }
        setFaqs(prevFaqs =>
            prevFaqs.map(faq =>
                faq.id === idToSave ? { ...faq, ...editData } : faq
            )
        );
        handleCancelEdit(); // Close edit form
    };

    const handleAddNew = () => {
        if (!editData.question.trim() || !editData.answer.trim()) {
            setError("Question and Answer cannot be empty.");
            return;
        }
        const newFaq: FAQItem = {
            id: uuidv4(), // Generate a unique ID
            question: editData.question.trim(),
            answer: editData.answer.trim(),
        };
        setFaqs(prevFaqs => [...prevFaqs, newFaq]);
        handleCancelEdit(); // Close add form
    };

    const handleDelete = (idToDelete: string) => {
        if (window.confirm("Are you sure you want to delete this FAQ?")) {
            setFaqs(prevFaqs => prevFaqs.filter(faq => faq.id !== idToDelete));
            setError(null);
            setSuccessMessage(null);
        }
    };

    const handleSaveChanges = async () => {
        if (!restaurantId) {
            setError("Restaurant ID not configured.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Send the entire updated 'faqs' array to the backend
            await apiClient.put(`/admin/restaurants/${restaurantId}/faqs`, { faqs: faqs });
            // Update Redux state locally for immediate UI feedback
            dispatch(updateFaqsLocally(faqs));
            setSuccessMessage("FAQs saved successfully!");
        } catch (err: any) {
             console.error("Error saving FAQs:", err);
             setError(err.response?.data?.message || err.message || "Failed to save FAQs.");
             // Optionally revert local state on error, or prompt user
             // setFaqs(initialFaqs ? JSON.parse(JSON.stringify(initialFaqs)) : []);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Display Existing FAQs */}
            <AnimatePresence>
                {faqs.map((faq) => (
                    <motion.div
                        key={faq.id}
                        layout // Animate layout changes
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border rounded-md p-3 bg-white shadow-sm"
                    >
                        {editingId === faq.id ? (
                            // Edit Form
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    name="question"
                                    value={editData.question}
                                    onChange={handleInputChange}
                                    placeholder="Question"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <textarea
                                    name="answer"
                                    value={editData.answer}
                                    onChange={handleInputChange}
                                    placeholder="Answer"
                                    rows={3}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <div className="flex justify-end gap-2 mt-1">
                                    <button onClick={handleCancelEdit} className="p-1 text-gray-500 hover:text-gray-700"><CancelIcon /></button>
                                    <button onClick={() => handleSaveEdit(faq.id)} className="p-1 text-green-600 hover:text-green-800"><SaveIcon /></button>
                                </div>
                            </div>
                        ) : (
                            // Display View
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-gray-800">{faq.question}</p>
                                    <p className="text-sm text-gray-600 mt-1">{faq.answer}</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0 ml-2">
                                    <button onClick={() => handleEditClick(faq)} className="p-1 text-blue-600 hover:text-blue-800"><EditIcon /></button>
                                    <button onClick={() => handleDelete(faq.id)} className="p-1 text-red-600 hover:text-red-800"><DeleteIcon /></button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Add New FAQ Form (Conditional) */}
            {isAdding && (
                 <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border rounded-md p-3 bg-gray-50 shadow-sm mt-4 space-y-2"
                 >
                    <h4 className="text-sm font-medium text-gray-700">Add New FAQ</h4>
                    <input
                        type="text"
                        name="question"
                        value={editData.question}
                        onChange={handleInputChange}
                        placeholder="Question"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <textarea
                        name="answer"
                        value={editData.answer}
                        onChange={handleInputChange}
                        placeholder="Answer"
                        rows={3}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <div className="flex justify-end gap-2 mt-1">
                        <button onClick={handleCancelEdit} className="p-1 text-gray-500 hover:text-gray-700"><CancelIcon /></button>
                        <button onClick={handleAddNew} className="p-1 text-green-600 hover:text-green-800"><SaveIcon /></button>
                    </div>
                 </motion.div>
            )}

            {/* Add & Save Buttons */}
            <div className="flex justify-between items-center pt-4 mt-4 border-t">
                <button
                    onClick={handleAddClick}
                    disabled={isAdding || editingId !== null} // Disable if already adding/editing
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    <PlusIcon /> Add FAQ
                </button>

                <div>
                    {error && <p className="text-sm text-red-600 mr-4 inline-block">{error}</p>}
                    {successMessage && <p className="text-sm text-green-600 mr-4 inline-block">{successMessage}</p>}
                    <button
                        onClick={handleSaveChanges}
                        disabled={isLoading || isAdding || editingId !== null} // Disable save if editing/adding
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:opacity-50"
                    >
                        {isLoading ? "Saving..." : "Save All Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FaqManager;
