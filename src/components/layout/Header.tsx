'use client';

import { useAuthStore } from '../../store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
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
import { LogOut, Menu, UserCircle, Bell } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

// Importujemy Sidebar (dla wersji mobilnej) oraz listę linków
import Sidebar, { navLinks } from './Sidebar';

export default function Header() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            if (res.data) setNotifications(res.data);
        } catch (error) {
            console.error('Failed to load notifications', error);
        }
    };

    const markAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const getInitials = (firstName?: string, lastName?: string) => {
        if (!firstName || !lastName) return 'U';
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    };

    return (
        // Header jest teraz "przezroczysty" i dopasowuje się do tła
        <header className="p-4 py-6 lg:p-8 flex justify-between items-center">
            {/* Hamburger Menu widoczne tylko na mobile */}
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0">
                        {/* Renderujemy Sidebar wewnątrz Sheet na mobile */}
                        <Sidebar isMobile={true} />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Pusta przestrzeń po lewej na desktopie (na przyszłą wyszukiwarkę) */}
            <div className="hidden md:block">
                {/* <Input placeholder="Szukaj..." className="w-64" /> */}
            </div>

            {/* Menu użytkownika po prawej */}
            <div className="flex items-center gap-4 bg-[#fff]/65 px-4 py-2 rounded-full shadow-sm">
                
                {/* Dzwoneczek Powiadomień */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative rounded-full">
                            <Bell className="h-5 w-5" />
                            {notifications.filter(n => !n.is_read).length > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal text-sm border-b pb-2 mb-2">
                            Powiadomienia
                        </DropdownMenuLabel>
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">Brak nowych powiadomień</div>
                        ) : (
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.map(n => (
                                    <div 
                                        key={n.id} 
                                        className={`p-3 text-sm border-b last:border-0 cursor-pointer hover:bg-muted/50 ${!n.is_read ? 'bg-blue-50/50 font-medium' : 'text-gray-600'}`}
                                        onClick={() => markAsRead(n.id, n.is_read)}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-xs">{n.title}</span>
                                            <span className="text-[10px] text-gray-400">{format(new Date(n.created_at), 'dd.MM.yyyy HH:mm', { locale: pl })}</span>
                                        </div>
                                        <p className="text-xs">{n.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-6 bg-gray-200"></div>

        <span className="text-sm text-gray-600">
          Witaj, <strong>{user?.first_name || 'Użytkowniku'}</strong>!
        </span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10 bg-[#fff]">
                                <AvatarImage src="" alt="Avatar" />
                                <AvatarFallback className="text-sm ">
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
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/profile" className="cursor-pointer w-full flex items-center">
                                <UserCircle className="mr-2 h-4 w-4" />
                                <span>Mój profil</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Wyloguj się</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}