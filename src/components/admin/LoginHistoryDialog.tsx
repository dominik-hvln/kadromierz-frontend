'use client';

import { useEffect, useState } from 'react';
import { superAdminApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

interface LoginEvent {
    id: string;
    created_at: string;
    ip_address: string | null;
    user_agent: string | null;
}

/** Skrót user agenta do czegoś czytelnego — pełna wartość zostaje w tooltipie. */
function describeDevice(ua: string | null): string {
    if (!ua) return 'Nieznane urządzenie';

    const platform = /iPhone|iPad/i.test(ua)
        ? 'iOS'
        : /Android/i.test(ua)
            ? 'Android'
            : /Windows/i.test(ua)
                ? 'Windows'
                : /Macintosh|Mac OS/i.test(ua)
                    ? 'macOS'
                    : /Linux/i.test(ua)
                        ? 'Linux'
                        : null;

    const browser = /Edg\//i.test(ua)
        ? 'Edge'
        : /OPR\/|Opera/i.test(ua)
            ? 'Opera'
            : /Chrome\//i.test(ua)
                ? 'Chrome'
                : /Firefox\//i.test(ua)
                    ? 'Firefox'
                    : /Safari\//i.test(ua)
                        ? 'Safari'
                        : null;

    if (/Capacitor|okhttp|Dart|CFNetwork/i.test(ua)) {
        return platform ? `Aplikacja mobilna (${platform})` : 'Aplikacja mobilna';
    }

    return [browser, platform].filter(Boolean).join(' · ') || 'Nieznane urządzenie';
}

export function LoginHistoryDialog({
    userId,
    onOpenChange,
}: {
    userId: string | null;
    onOpenChange: (open: boolean) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (!userId) {
            setData(null);
            return;
        }
        setLoading(true);
        superAdminApi
            .getUserLoginHistory(userId)
            .then(setData)
            .catch(() => toast.error('Nie udało się pobrać historii logowań'))
            .finally(() => setLoading(false));
    }, [userId]);

    const events: LoginEvent[] = data?.events || [];
    const summary = data?.summary;

    return (
        <Dialog open={Boolean(userId)} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>Historia logowań</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" /> Ładowanie…
                    </div>
                ) : !data ? null : (
                    <div className="space-y-4">
                        <div className="text-sm">
                            <div className="font-medium">{data.user.name || data.user.email}</div>
                            {data.user.name && <div className="text-muted-foreground text-xs">{data.user.email}</div>}
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-lg border p-3">
                                <div className="text-xs text-muted-foreground">Ostatnie logowanie</div>
                                <div className="text-sm font-semibold mt-1">
                                    {data.lastSignInAt
                                        ? new Date(data.lastSignInAt).toLocaleString('pl-PL', {
                                              day: '2-digit', month: '2-digit', year: '2-digit',
                                              hour: '2-digit', minute: '2-digit',
                                          })
                                        : '—'}
                                </div>
                            </div>
                            <div className="rounded-lg border p-3">
                                <div className="text-xs text-muted-foreground">Różne adresy IP</div>
                                <div className="text-sm font-semibold mt-1">{summary?.distinctIps ?? 0}</div>
                            </div>
                            <div className="rounded-lg border p-3">
                                <div className="text-xs text-muted-foreground">Różne urządzenia</div>
                                <div className="text-sm font-semibold mt-1">{summary?.distinctDevices ?? 0}</div>
                            </div>
                        </div>

                        <div className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                            <Info className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>
                                System rejestruje <strong>konto</strong>, a nie osobę. Jeśli z jednego loginu
                                korzysta kilka osób, nie da się ich rozróżnić — jedynym sygnałem współdzielenia
                                są różne adresy IP i urządzenia powyżej.
                            </p>
                        </div>

                        {events.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-6">
                                Brak zapisanych logowań. Historia zbierana jest od wdrożenia tej funkcji —
                                wcześniejsze logowania nie zostały nigdzie zapisane.
                            </div>
                        ) : (
                            <div className="max-h-80 overflow-y-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-xs text-gray-500 sticky top-0">
                                        <tr>
                                            <th className="text-left font-medium px-3 py-2">Data</th>
                                            <th className="text-left font-medium px-3 py-2">Adres IP</th>
                                            <th className="text-left font-medium px-3 py-2">Urządzenie</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {events.map((e) => (
                                            <tr key={e.id}>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    {new Date(e.created_at).toLocaleString('pl-PL', {
                                                        day: '2-digit', month: '2-digit', year: '2-digit',
                                                        hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="px-3 py-2 font-mono text-xs text-gray-600">
                                                    {e.ip_address || '—'}
                                                </td>
                                                <td className="px-3 py-2 text-gray-600" title={e.user_agent || ''}>
                                                    {describeDevice(e.user_agent)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
