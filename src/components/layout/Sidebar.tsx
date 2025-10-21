import Link from 'next/link';
import {Home, FolderKanban, Users, Clock, MapPin} from 'lucide-react';

export const navLinks = [
    { href: '/dashboard', label: 'Panel Główny', icon: Home },
    { href: '/dashboard/projects', label: 'Projekty', icon: FolderKanban },
    { href: '/dashboard/users', label: 'Użytkownicy', icon: Users },
    { href: '/dashboard/entries', label: 'Ewidencja Czasu', icon: Clock },
    { href: '/dashboard/locations', label: 'Kody Ogólne', icon: MapPin },
];

export default function Sidebar() {
    return (
        <aside className="hidden md:flex w-64 bg-background text-foreground p-4 border-r flex-col">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-center">TimeTracker</h1>
            </div>
            <nav className="flex-1">
                <ul>
                    {navLinks.map((link) => (
                        <li key={link.href} className="mb-2">
                            <Link
                                href={link.href}
                                className="flex items-center gap-3 p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                <link.icon className="h-5 w-5" />
                                <span>{link.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="mt-auto">
                <p className="text-xs text-center text-muted-foreground">© 2025 HVLN</p>
            </div>
        </aside>
    );
}