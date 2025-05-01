// src/components/admin/menu/AdminMenuCard.tsx (Example Path)

import React, { useState } from 'react';
import Image from 'next/image';
import type { MenuItem } from '@/constants/types'; // Adjust path
import placeholderImg from '@/../public/Images/menu.png'; // Adjust path
import { fetchAllMenuItemsFromApi } from '@/lib/slices/restaurantSlice';

// Icons
const EditIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const DeleteIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

interface AdminMenuCardProps {
    item: MenuItem;
    onEdit: () => void; // Trigger modal opening
    onDelete: (itemId: string) => Promise<boolean>; // Handle deletion
}

const AdminMenuCard: React.FC<AdminMenuCardProps> = ({ item, onEdit, onDelete }) => {

    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = async () => {
        setIsDeleting(true);
        await onDelete(item.id);
        // No need to setIsDeleting(false) as the component might unmount on successful delete/refetch
    };

    const formatCurrency = (priceString: string | undefined): string => {
        const price = parseFloat(priceString || '0');
        if (isNaN(price)) return '$ --.--';
        return `$ ${price.toFixed(2)}`;
    };

    return (
        <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden flex flex-col h-full">
            {/* Image */}
            <div className="relative h-40 w-full bg-gray-200">
                 <Image
                    src={item.imageUrl || placeholderImg}
                    alt={item.name}
                    fill
                    className="object-cover"
                    onError={(e) => { e.currentTarget.src = placeholderImg.src; }}
                 />
                 {/* Availability Badge */}
                 <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium text-white ${item.isAvailable === false ? 'bg-red-500' : 'bg-green-500'}`}>
                     {item.isAvailable === false ? 'Unavailable' : 'Available'}
                 </span>
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col flex-grow">
                <h3 className="text-base font-semibold text-gray-800 truncate mb-1">{item.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2 flex-grow">{item.description || 'No description.'}</p>

                {/* Price & Category */}
                <div className="flex justify-between items-center text-sm mb-2">
                    <span className="font-medium text-primary-dark">{formatCurrency(item.price)}</span>
                    {/* TODO: Need category name here - requires joining with categories state */}
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{item.categoryId || 'Uncategorized'}</span>
                </div>

                 {/* Tags */}
                 {item.tags && item.tags.length > 0 && (
                     <div className="flex flex-wrap gap-1 mb-3">
                         {item.tags.slice(0, 3).map((tag, idx) => (
                             <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full">{tag}</span>
                         ))}
                     </div>
                 )}

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-auto border-t pt-2">
                     <button
                        onClick={onEdit}
                        title="Edit Item"
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                        <EditIcon />
                    </button>
                    <button
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                        title="Delete Item"
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    >
                         {isDeleting ? <Spinner /> : <DeleteIcon />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminMenuCard;

const Spinner = () => <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>; // Local spinner
