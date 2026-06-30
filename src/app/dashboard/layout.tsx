'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sonner';
import OnboardingGate from '@/components/billing/OnboardingGate';
import TermsAcceptanceModal from '@/components/billing/TermsAcceptanceModal';
import AnnouncementBanner from '@/components/layout/AnnouncementBanner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isHydrating, user, refreshSession } = useAuthStore();
    const router = useRouter();
    const [stripeReturn] = useState(
        () => typeof window !== 'undefined' && /[?&]success=true/.test(window.location.search),
    );

    // Ochrona trasy
    useEffect(() => {
        if (isHydrating) return;
        if (!isAuthenticated) {
            router.replace('/');
        }
    }, [isAuthenticated, isHydrating, router]);

    // Świeże flagi onboardingu / regulaminu przy wejściu do panelu
    useEffect(() => {
        if (isHydrating || !isAuthenticated) return;
        refreshSession();
    }, [isHydrating, isAuthenticated, refreshSession]);

    if (isHydrating || !isAuthenticated) {
        return <div className="flex h-screen items-center justify-center">Ładowanie...</div>;
    }

    const needsTerms = Boolean(user?.needsTermsAcceptance);
    const needsOnboarding = Boolean(user?.needsOnboarding);

    // Blokady (admin + manager). Najpierw regulamin, potem onboarding.
    if (!stripeReturn && needsTerms) {
        return (
            <>
                <TermsAcceptanceModal />
                <Toaster richColors />
            </>
        );
    }
    if (!stripeReturn && needsOnboarding) {
        return (
            <>
                <OnboardingGate />
                <Toaster richColors />
            </>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 p-6 overflow-y-auto flex flex-col">
                    <div className="flex-1">
                        <AnnouncementBanner />
                        {children}
                    </div>
                </main>
                <Toaster richColors />
            </div>
        </div>
    );
}
