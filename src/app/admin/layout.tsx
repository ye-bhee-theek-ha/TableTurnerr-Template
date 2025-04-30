// src/app/admin/layout.tsx

import React, { ReactNode } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import Header from '@/components/Header';

export default function AdminLayout({ children }: { children: ReactNode }) {
    
    // TODO: Add robust authorization check here. Redirect non-admins/staff.
    // Example (needs proper implementation):
    // const { profile, isLoading } = useUser();
    // const router = useRouter();
    // useEffect(() => {
    //    if (!isLoading && (!profile || !['admin', 'staff'].includes(profile.role))) {
    //       router.replace('/'); // Redirect unauthorized users
    //    }
    // }, [profile, isLoading, router]);
    // if (isLoading || !profile || !['admin', 'staff'].includes(profile.role)) {
    //     return <div>Loading or Unauthorized...</div>; // Or a proper loading/error component
    // }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Optional Admin Header (or use main site Header) */}
                {/* <Header isAdmin /> */}
                 <div className='bg-white shadow-sm p-4'>
                    {/* Simplified Header Placeholder */}
                    <h1 className='text-xl font-semibold text-gray-700'>Admin Panel</h1>
                 </div>


                {/* Page Content */}
                {/* overflow-y-auto enables scrolling for content longer than screen height */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children} {/* Child pages (e.g., orders, site-content) render here */}
                </main>
            </div>
        </div>
    );
}
