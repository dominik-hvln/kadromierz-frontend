// src/components/layout/Header.tsx
'use client';

import { useAuthStore } from '../../store/auth.store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { navLinks } from './Sidebar';

export default function Header() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    // Funkcja do pobierania inicjałów
    const getInitials = (firstName?: string, lastName?: string) => {
        if (!firstName || !lastName) return 'U';
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    };

    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                        <nav className="grid gap-6 text-lg font-medium">
                            <Link href="#" className="text-xl font-bold">TwojaAplikacja</Link>
                            {navLinks.map(link => (
                                <Link key={link.href} href={link.href} className="flex items-center gap-4 text-muted-foreground hover:text-foreground">
                                    <link.icon className="h-6 w-6" />
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
            <div>
                {/* Ta przestrzeń może być użyta w przyszłości np. na wyszukiwarkę */}
            </div>
            <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Witaj, <strong>{user?.first_name || 'Użytkowniku'}</strong>!
        </span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src="" alt="Avatar" />
                                <AvatarFallback>
                                    {getInitials(user?.first_name, user?.last_name)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {user?.first_name} {user?.last_name}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Wyloguj się</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}