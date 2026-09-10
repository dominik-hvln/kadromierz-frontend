'use client';

import { useEffect, useState } from 'react';
import { superAdminApi } from '@/lib/api';
import { toast } from 'sonner';
import CompanyGrowthChart from '@/components/admin/CompanyGrowthChart';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalCompanies: 0,
        newCompanies: 0,
        activeSubscriptions: 0,
        mrr: 0
    });
    const [growth, setGrowth] = useState<any[]>([]);
    const [logins, setLogins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        // Kafelki ładujemy niezależnie — awaria jednego nie może wygasić pulpitu.
        const [statsRes, growthRes, loginsRes] = await Promise.allSettled([
            superAdminApi.getStats(),
            superAdminApi.getCompanyGrowth(12),
            superAdminApi.getRecentLogins(8),
        ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        else toast.error('Błąd pobierania statystyk');

        if (growthRes.status === 'fulfilled') setGrowth(growthRes.value);
        if (loginsRes.status === 'fulfilled') setLogins(loginsRes.value);

        setLoading(false);
    };

    if (loading) return <div>Ładowanie danych...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-500">Wszystkie Firmy</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalCompanies}</div>
                    <div className="text-xs text-green-600 mt-1">+{stats.newCompanies} w tym miesiącu</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-500">Aktywne Subskrypcje</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-500">Przychód MRR</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">{stats.mrr} PLN</div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <CompanyGrowthChart data={growth} />

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-medium text-gray-500 mb-4">Ostatnie logowania</h2>
                    {logins.length === 0 ? (
                        <div className="text-sm text-gray-400 py-8 text-center">
                            Brak zarejestrowanych logowań.
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {logins.map((l) => {
                                const name = [l.first_name, l.last_name].filter(Boolean).join(' ');
                                return (
                                    <li key={l.id} className="flex items-center justify-between py-2.5 gap-4">
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                {name || l.email}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {l.company_name || 'Bez firmy'}
                                                {name ? ` · ${l.email}` : ''}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 whitespace-nowrap">
                                            {new Date(l.last_sign_in_at).toLocaleString('pl-PL', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
