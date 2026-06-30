'use client';

import { useEffect, useMemo, useState } from 'react';
import { superAdminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format, differenceInCalendarDays } from 'date-fns';
import { pl } from 'date-fns/locale';

type Filter = 'all' | 'pending_transfer' | 'trialing' | 'active' | 'expiring';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    active: { label: 'Aktywna', cls: 'bg-green-600 hover:bg-green-700' },
    trialing: { label: 'Trial', cls: 'bg-blue-100 text-blue-700' },
    pending_transfer: { label: 'Oczekuje na przelew', cls: 'bg-amber-100 text-amber-700' },
    canceled: { label: 'Anulowana', cls: 'bg-gray-200 text-gray-700' },
};

export default function AdminSubscriptionsPage() {
    const [subs, setSubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('all');
    const [busyId, setBusyId] = useState<string | null>(null);

    const fetchSubs = async () => {
        try {
            setSubs(await superAdminApi.getSubscriptions());
        } catch {
            toast.error('Błąd pobierania subskrypcji');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubs();
    }, []);

    const counts = useMemo(() => {
        const c = { all: subs.length, pending_transfer: 0, trialing: 0, active: 0, expiring: 0 };
        const today = new Date();
        subs.forEach((s) => {
            if (s.status === 'pending_transfer') c.pending_transfer++;
            if (s.status === 'trialing') c.trialing++;
            if (s.status === 'active') c.active++;
            if (s.current_period_end) {
                const d = differenceInCalendarDays(new Date(s.current_period_end), today);
                if (d >= 0 && d <= 7) c.expiring++;
            }
        });
        return c;
    }, [subs]);

    const filtered = useMemo(() => {
        const today = new Date();
        return subs.filter((s) => {
            if (filter === 'all') return true;
            if (filter === 'expiring') {
                if (!s.current_period_end) return false;
                const d = differenceInCalendarDays(new Date(s.current_period_end), today);
                return d >= 0 && d <= 7;
            }
            return s.status === filter;
        });
    }, [subs, filter]);

    const handleActivate = async (s: any) => {
        if (!confirm(`Aktywować subskrypcję firmy "${s.companies?.name}" (wpłata zaksięgowana)?`)) return;
        setBusyId(s.id);
        try {
            await superAdminApi.activateTransfer(s.company_id);
            toast.success('Subskrypcja aktywowana');
            fetchSubs();
        } catch {
            toast.error('Błąd aktywacji');
            setBusyId(null);
        }
    };

    if (loading) return <div>Ładowanie subskrypcji…</div>;

    const tabs: { key: Filter; label: string; count: number }[] = [
        { key: 'all', label: 'Wszystkie', count: counts.all },
        { key: 'pending_transfer', label: 'Oczekujące przelewy', count: counts.pending_transfer },
        { key: 'trialing', label: 'Trial', count: counts.trialing },
        { key: 'active', label: 'Aktywne', count: counts.active },
        { key: 'expiring', label: 'Wygasające (7 dni)', count: counts.expiring },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Centrum subskrypcji</h1>
                <p className="text-muted-foreground text-sm">Przegląd i obsługa subskrypcji wszystkich firm.</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setFilter(t.key)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            filter === t.key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {t.label} <span className="opacity-70">({t.count})</span>
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Firma</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead>Metoda</TableHead>
                            <TableHead>Koniec okresu</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((s) => {
                            const badge = STATUS_BADGE[s.status] || { label: s.status, cls: 'bg-gray-200 text-gray-700' };
                            const method = s.companies?.billing_type;
                            return (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">
                                        <a href={`/admin/companies/${s.company_id}`} className="hover:underline text-indigo-900">
                                            {s.companies?.name || '—'}
                                        </a>
                                    </TableCell>
                                    <TableCell>{s.plans?.name || <span className="text-gray-400">—</span>}</TableCell>
                                    <TableCell className="text-center"><Badge className={badge.cls}>{badge.label}</Badge></TableCell>
                                    <TableCell className="text-sm">
                                        {method === 'card' ? 'Karta' : method === 'transfer' ? 'Przelew' : '—'}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {s.current_period_end ? format(new Date(s.current_period_end), 'd MMM yyyy', { locale: pl }) : '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {s.status === 'pending_transfer' && (
                                            <Button size="sm" disabled={busyId === s.id} onClick={() => handleActivate(s)}>
                                                Aktywuj
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">Brak subskrypcji w tym widoku.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
