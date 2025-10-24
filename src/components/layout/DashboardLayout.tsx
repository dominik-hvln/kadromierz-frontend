'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

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
        return (
            // Używamy już nowego tła --background
            <div className="flex h-screen items-center justify-center">
                Ładowanie...
            </div>
        );
    }

    // Jeśli zalogowany, pokaż layout
    return (
        // Główny kontener ma teraz tło z globals.css
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />
                {/* Dodajemy padding i overflow do głównej treści */}
                <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}