'use client';

import { useEffect, useMemo, useState } from 'react';
import { superAdminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Search, KeyRound, UserX, UserCheck, Loader2 } from 'lucide-react';

const ROLE_LABEL: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Administrator',
    manager: 'Manager',
    employee: 'Pracownik',
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const data = await superAdminApi.getUsers();
            setUsers(data);
        } catch {
            toast.error('Błąd pobierania użytkowników');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) =>
            [u.email, u.first_name, u.last_name, u.company_name, ROLE_LABEL[u.role]]
                .filter(Boolean)
                .some((v: string) => v.toLowerCase().includes(q)),
        );
    }, [users, query]);

    const handleReset = async (u: any) => {
        if (!confirm(`Wysłać link resetujący hasło do ${u.email}?`)) return;
        setBusyId(u.id);
        try {
            const res = await superAdminApi.resetUserPassword(u.id);
            toast.success(res?.message || 'Wysłano link resetujący');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Błąd resetu hasła');
        } finally {
            setBusyId(null);
        }
    };

    const handleToggleActive = async (u: any) => {
        const willActivate = u.status === 'inactive';
        if (!confirm(`${willActivate ? 'Aktywować' : 'Dezaktywować'} konto ${u.email}?`)) return;
        setBusyId(u.id);
        try {
            await superAdminApi.setUserActive(u.id, willActivate);
            toast.success(willActivate ? 'Użytkownik aktywowany' : 'Użytkownik dezaktywowany');
            fetchUsers();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Błąd zmiany statusu');
            setBusyId(null);
        }
    };

    if (loading) return <div>Ładowanie użytkowników…</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Użytkownicy</h1>
                <p className="text-muted-foreground text-sm">Wszyscy użytkownicy w systemie ({users.length}).</p>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    className="pl-9"
                    placeholder="Szukaj: imię, e-mail, firma…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Imię i nazwisko</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Rola</TableHead>
                            <TableHead>Firma</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((u) => {
                            const inactive = u.status === 'inactive';
                            return (
                                <TableRow key={u.id} className={inactive ? 'opacity-60' : ''}>
                                    <TableCell className="font-medium">{[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}</TableCell>
                                    <TableCell className="text-sm">{u.email}</TableCell>
                                    <TableCell><Badge variant="secondary">{ROLE_LABEL[u.role] || u.role}</Badge></TableCell>
                                    <TableCell className="text-sm">{u.company_name || <span className="text-gray-400">—</span>}</TableCell>
                                    <TableCell className="text-center">
                                        {inactive
                                            ? <span className="text-red-600 text-xs font-semibold">Nieaktywny</span>
                                            : <span className="text-green-600 text-xs font-semibold">Aktywny</span>}
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="sm" disabled={busyId === u.id} onClick={() => handleReset(u)} title="Reset hasła">
                                            {busyId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                                        </Button>
                                        {u.role !== 'super_admin' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={busyId === u.id}
                                                onClick={() => handleToggleActive(u)}
                                                title={inactive ? 'Aktywuj' : 'Dezaktywuj'}
                                                className={inactive ? 'text-green-600' : 'text-red-600'}
                                            >
                                                {inactive ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">Brak wyników.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
