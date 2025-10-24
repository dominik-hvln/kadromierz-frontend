'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ActivityFeed } from './ActivityFeed'; // Importujemy feed aktywności

// Typ dla danych podsumowania
interface DashboardSummary {
    projects: number;
    tasks: number;
    employees: number;
}

// Komponent dla pojedynczej karty podsumowania
function SummaryCard({ title, value, bgColorClass }: { title: string, value: number | string, bgColorClass: string }) {
    return (
        // Używamy klasy .glassmorphism-box, ale dodajemy też kolor tła
        <div className={`glassmorphism-box p-6 ${bgColorClass}`}>
            <p className="text-sm font-medium text-gray-700">{title}</p>
            <p className="text-3xl font-bold text-black">{value}</p>
        </div>
    );
}

export function AdminDashboard() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await api.get('/dashboard/summary');
                setSummary(response.data);
            } catch (error) {
                toast.error('Błąd', { description: 'Nie udało się pobrać podsumowania.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSummary();
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

            {/* Kolumna lewa (szersza) */}
            <div className="lg:col-span-2 space-y-6">

                {/* Sekcja "Moje Dane" (uproszczona) */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">Witaj, Managerze!</h2>
                    {/* Tutaj można dodać więcej informacji o zalogowanym managerze */}
                </section>

                {/* Sekcja "Podsumowanie" */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">Podsumowanie</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {isLoading ? <p>Ładowanie...</p> : (
                            <>
                                <SummaryCard title="Wszystkie Projekty" value={summary?.projects ?? 0} bgColorClass="bg-green-100/70" />
                                <SummaryCard title="Wszystkie Zlecenia" value={summary?.tasks ?? 0} bgColorClass="bg-blue-100/70" />
                                <SummaryCard title="Liczba Pracowników" value={summary?.employees ?? 0} bgColorClass="bg-yellow-100/70" />
                            </>
                        )}
                    </div>
                </section>

                {/* Sekcje "Nowe Zlecenia" i "Zakończone Zlecenia" (na przyszłość) */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">Ostatnio utworzone zlecenia</h2>
                    <div className="glassmorphism-box p-4">
                        <p className="text-muted-foreground">Miejsce na listę nowych zleceń...</p>
                    </div>
                </section>

            </div>

            {/* Kolumna prawa (węższa) - Aktywności */}
            <div className="lg:col-span-1 space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-4">Aktywność na Żywo</h2>
                    {/* Używamy tutaj komponentu ActivityFeed, który już mamy! */}
                    <ActivityFeed />
                </section>
            </div>
        </div>
    );
}