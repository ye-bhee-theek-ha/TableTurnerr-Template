// src/components/admin/AdminSidebar.tsx

"use client"; 

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Placeholder Icons (Replace with actual icons from a library like lucide-react or SVGs)
const OrderIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const ContentIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const MenuIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
const AnalyticsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;
const SettingsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;


// Define navigation items
const navItems = [
    { name: 'Orders', href: '/admin/orders', icon: OrderIcon },
    { name: 'Site Content', href: '/admin/site-content', icon: ContentIcon },
    { name: 'Menu Items', href: '/admin/menu', icon: MenuIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: AnalyticsIcon },
    // Add more sections as needed
    // { name: 'Settings', href: '/admin/settings', icon: SettingsIcon },
];

const AdminSidebar: React.FC = () => {
    const pathname = usePathname(); // Get the current route path

    return (
        <aside className="w-60 bg-white shadow-md flex flex-col h-full flex-shrink-0">
            {/* Logo or Title Area */}
            <div className="h-16 flex items-center justify-center border-b">
                {/* Replace with your logo component or text */}
                <Link href="/admin">
                    <span className="text-xl font-bold text-primary">Admin Panel</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`); // Check if path matches or starts with href
                    return (
                        <Link key={item.name} href={item.href} legacyBehavior>
                            <a
                                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 group ${
                                    isActive
                                        ? 'bg-primary/10 text-primary' // Active state style
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Inactive state style
                                }`}
                            >
                                <item.icon />
                                <span className="ml-3">{item.name}</span>
                            </a>
                        </Link>
                    );
                })}
            </nav>

            {/* Optional: Footer or User Info in Sidebar */}
            <div className="border-t p-4">
                {/* Add user info or logout button here if desired */}
                <p className="text-xs text-gray-500">© Grill Shack Admin</p>
            </div>
        </aside>
    );
};

export default AdminSidebar;

