'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { Toaster } from '@/components/ui/sonner';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, isHydrating } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isHydrating && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isHydrating, router]);

    if (isHydrating) {
        return <div>Ładowanie sesji...</div>;
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6">{children}</main>
                <Toaster richColors />
            </div>
        </div>
    );
}