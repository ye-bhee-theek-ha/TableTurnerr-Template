// src/app/admin/site-content/page.tsx (Example Path)

"use client";

import React from 'react';
import SiteInfoForm from '@/components/admin/SiteInfoForm'; // Adjust path
import FaqManager from '@/components/admin/FaqManager'; // Adjust path
import { useUser } from '@/hooks/useUser'; // Adjust path
import { useRouter } from 'next/navigation'; // For potential redirect

const AdminSiteContentPage: React.FC = () => {
    // --- Authorization Check ---
    const { profile } = useUser();
    const router = useRouter();
    const isAuthorized = profile?.role === 'admin' || profile?.role === 'staff'; // Example check

    // Redirect if not authorized (or show appropriate message)
    // React.useEffect(() => {
    //     if (profile && !isAuthorized) {
    //         router.replace('/');
    //     }
    // }, [profile, isAuthorized, router]);

    // if (!profile || !isAuthorized) {
    //     return <div>Unauthorized Access</div>; // Or loading state
    // }
    // --- End Authorization Check ---

    return (
        <div className="space-y-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Site Content Management</h1>

            {/* Section for General Restaurant Info */}
            <section className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Restaurant Information</h2>
                <SiteInfoForm />
            </section>

            {/* Section for FAQs */}
            <section className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-100">
                 <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Frequently Asked Questions (FAQs)</h2>
                 <FaqManager />
            </section>

            {/* Add more sections here as needed (e.g., Banners, Testimonials) */}

        </div>
    );
};

export default AdminSiteContentPage;
