'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// ✅ 1. Definiujemy interfejs zamiast używać 'any'
interface Company {
    id: string;
    name: string | null; // Zakładam, że nazwa może być nullem
    created_at: string;
    // Możesz tu dodać inne pola, jeśli backend je zwraca (np. nip, address)
}

export default function SuperAdminPage() {
    // ✅ 2. Używamy naszego interfejsu w useState
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                // ✅ 3. Możemy też dodać typowanie do odpowiedzi axios, jeśli chcemy być super-poprawni
                // Ale tutaj TypeScript sam wywnioskuje typ response.data, jeśli api jest dobrze otypowane,
                // lub po prostu 'zaufa' nam przy przypisaniu do setCompanies.
                const response = await api.get<Company[]>('/super-admin/companies');
                setCompanies(response.data);
            } catch (error) {
                console.error('Błąd pobierania firm:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, []);

    if (loading) {
        return <div className="p-8">Ładowanie panelu Super Admina...</div>;
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Panel Super Admina</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Liczba Firm</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{companies.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Zarejestrowane Firmy</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Nazwa Firmy</TableHead>
                                <TableHead>Data utworzenia</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companies.map((company) => (
                                <TableRow key={company.id}>
                                    <TableCell className="font-mono text-xs">{company.id}</TableCell>
                                    <TableCell className="font-medium">{company.name || 'Bez nazwy'}</TableCell>
                                    <TableCell>
                                        {new Date(company.created_at).toLocaleDateString('pl-PL')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">Aktywna</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}