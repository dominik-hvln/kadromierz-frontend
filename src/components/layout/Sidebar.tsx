'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderKanban, Users, Clock, MapPin, Activity, Settings } from 'lucide-react';
import { cn } from '@/lib/utils'; // Importujemy cn do łączenia klas

// Definiujemy typ dla linku
interface NavLink {
    href: string;
    label: string;
    icon: React.ElementType;
}

// Definiujemy nasze linki w jednym miejscu
export const navLinks: NavLink[] = [
    { href: '/dashboard', label: 'Panel Główny', icon: Home },
    { href: '/dashboard/activity', label: 'Aktywność', icon: Activity },
    { href: '/dashboard/entries', label: 'Ewidencja Czasu', icon: Clock },
    { href: '/dashboard/projects', label: 'Projekty', icon: FolderKanban },
    { href: '/dashboard/users', label: 'Użytkownicy', icon: Users },
    { href: '/dashboard/locations', label: 'Kody Ogólne', icon: MapPin },
];

// Definiujemy typ dla właściwości komponentu
interface SidebarProps {
    isMobile?: boolean; // Oznaczamy jako opcjonalny
}

export default function Sidebar({ isMobile = false }: SidebarProps) {
    const pathname = usePathname();

    // Wspólny JSX dla linków, aby nie powtarzać kodu
    const renderNavLinks = () => (
        <nav className="flex-1 space-y-2 px-4">
            {navLinks.map((link) => {
                const isActive = pathname === link.href;

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                            isActive
                                ? "bg-primary text-primary-foreground" // Styl aktywnego linku (czarne tło, biały tekst)
                                : "text-muted-foreground hover:bg-muted" // Styl domyślny
                        )}
                    >
                        {/* Ikona w delikatnym szarym kółku (zgodnie z inspiracją) */}
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            isActive ? "bg-primary-foreground/20" : "bg-muted" // Lepsze tło dla ikony
                        )}>
                            <link.icon className={cn(
                                "h-4 w-4",
                                isActive ? "text-primary-foreground" : "text-primary" // Kolor ikony
                            )} />
                        </div>
                        <span className="font-medium">{link.label}</span>
                    </Link>
                );
            })}
        </nav>
    );

    if (isMobile) {
        // Wersja mobilna (dla Sheet) - bez logo na górze
        return (
            <div className="flex h-full flex-col py-6">
                {renderNavLinks()}
            </div>
        );
    }

    // Wersja desktopowa (stała)
    return (
        <aside className={cn(
            "hidden md:flex h-full w-72 flex-col",
        )}>
            <div className="flex h-[72px] items-center px-8">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    {/* Możesz tu wstawić swoje logo */}
                    <span className="text-xl">TwojaAplikacja</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
                {renderNavLinks()}
            </div>
            {/* Tutaj możemy dodać profil użytkownika na dole, jak w designie */}
            {/* <div className="mt-auto p-4">...</div> */}
        </aside>
    );
}