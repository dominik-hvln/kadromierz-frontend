'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    FolderKanban,
    Users,
    Clock,
    MapPin,
    Activity,
    FileText, // ✅ Ikona dla Raportów
    ShieldCheck // ✅ Ikona dla Super Admina
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store'; // ✅ Potrzebne do sprawdzania roli

// Rozszerzamy typ linku o opcjonalne role
interface NavLink {
    href: string;
    label: string;
    icon: React.ElementType;
    roles?: string[]; // Tablica ról, które widzą ten link (brak = wszyscy)
}

export const navLinks: NavLink[] = [
    { href: '/dashboard', label: 'Panel Główny', icon: Home },
    { href: '/dashboard/activity', label: 'Aktywność', icon: Activity },
    { href: '/dashboard/entries', label: 'Ewidencja Czasu', icon: Clock },
    { href: '/dashboard/projects', label: 'Projekty', icon: FolderKanban },

    // ✅ NOWY LINK: Raporty (Dostępny dla wszystkich lub np. bez pracowników)
    { href: '/dashboard/reports', label: 'Raporty', icon: FileText },

    { href: '/dashboard/users', label: 'Użytkownicy', icon: Users },
    { href: '/dashboard/locations', label: 'Kody Ogólne', icon: MapPin },

    // ✅ NOWY LINK: Super Admin (Tylko dla super_admin)
    {
        href: '/dashboard/super-admin',
        label: 'Super Admin',
        icon: ShieldCheck,
        roles: ['super_admin']
    },
];

interface SidebarProps {
    isMobile?: boolean;
}

export default function Sidebar({ isMobile = false }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useAuthStore(); // Pobieramy usera ze stanu

    // ✅ Filtrujemy linki na podstawie roli zalogowanego użytkownika
    const visibleLinks = navLinks.filter(link => {
        // Jeśli link nie ma wymagań co do roli, pokazujemy go każdemu
        if (!link.roles) return true;
        // Jeśli link wymaga roli, a user nie jest zalogowany lub nie ma roli, ukrywamy
        if (!user || !user.role) return false;
        // Sprawdzamy czy rola usera jest na liście dozwolonych
        return link.roles.includes(user.role);
    });

    const renderNavLinks = () => (
        <nav className="flex-1 space-y-2 px-4">
            {visibleLinks.map((link) => {
                // Sprawdzamy czy link jest aktywny (także dla podstron, np. /reports/new)
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-3 rounded-[25px] px-3 py-2 transition-all",
                            isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            isActive ? "bg-primary-foreground/20" : "bg-muted"
                        )}>
                            <link.icon className={cn(
                                "h-4 w-4",
                                isActive ? "text-primary-foreground" : "text-primary"
                            )} />
                        </div>
                        <span className="font-medium">{link.label}</span>
                    </Link>
                );
            })}
        </nav>
    );

    if (isMobile) {
        return (
            <div className="flex h-full flex-col py-6">
                {renderNavLinks()}
            </div>
        );
    }

    return (
        <aside className={cn("hidden md:flex h-full w-72 flex-col")}>
            <div className="flex h-[72px] items-center px-8">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <span className="text-xl">TwojaAplikacja</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
                {renderNavLinks()}
            </div>
        </aside>
    );
}