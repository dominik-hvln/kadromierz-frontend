'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isHydrating } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (isHydrating) return;
        if (!isAuthenticated) {
            router.replace('/'); // Przekieruj na stronę główną (logowanie)
        }
    }, [isAuthenticated, isHydrating, router]);

    if (isHydrating || !isAuthenticated) {
        return <div className="flex h-screen items-center justify-center">Ładowanie...</div>;
    }

    // Jeśli zalogowany, pokaż layout
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6 overflow-y-auto">{children}</main>
                <Toaster richColors /> {/* Toaster specyficzny dla dashboardu */}
            </div>
        </div>
    );
}