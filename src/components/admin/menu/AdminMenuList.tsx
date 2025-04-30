// src/components/admin/menu/AdminMenuList.tsx (Example Path)

import React from 'react';
import { motion } from 'framer-motion';
import type { MenuItem } from '@/constants/types'; // Adjust path
import AdminMenuCard from './AdminMenuCard'; // Import the card component

interface AdminMenuListProps {
    items: MenuItem[];
    onEdit: (item: MenuItem) => void;
    onDelete: (itemId: string) => Promise<boolean>;
}

const AdminMenuList: React.FC<AdminMenuListProps> = ({ items, onEdit, onDelete }) => {

    if (!items || items.length === 0) {
        return (
            <div className="text-center py-10 px-4 text-gray-500">
                No menu items found matching the current filters.
            </div>
        );
    }

    return (
        // Use a grid layout for the cards
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item, index) => (
                 <motion.div
                    key={item.id}
                    layout // Animate layout changes when filtering/sorting
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                 >
                    <AdminMenuCard
                        item={item}
                        onEdit={() => onEdit(item)} // Pass item to edit handler
                        onDelete={onDelete}
                    />
                </motion.div>
            ))}
        </div>
    );
};

export default AdminMenuList;
