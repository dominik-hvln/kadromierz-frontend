'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api'; //
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Typy danych
interface Company {
    id: string;
    name: string | null;
    created_at: string;
}

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    company_id?: string; // Zakładam, że user może być przypisany do firmy
}

export default function SuperAdminPage() {
    const [activeTab, setActiveTab] = useState<'companies' | 'users'>('companies');
    const [companies, setCompanies] = useState<Company[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pobieranie danych
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // 1. Pobieramy Firmy (to powinno działać)
            try {
                const companiesRes = await api.get<Company[]>('/super-admin/companies');
                setCompanies(companiesRes.data);
            } catch (error) {
                console.error('Błąd pobierania firm:', error);
            }

            // 2. Pobieramy Userów (to może na razie rzucać błąd 500)
            try {
                const usersRes = await api.get<User[]>('/super-admin/users');
                setUsers(usersRes.data);
            } catch (error) {
                console.error('Błąd pobierania użytkowników (czy backend jest gotowy?):', error);
                // Nie blokujemy reszty aplikacji
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filtrowanie (proste, po stronie klienta na start)
    const filteredCompanies = companies.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="flex h-full items-center justify-center">Ładowanie panelu...</div>;
    }

    return (
        <div className="p-8 space-y-6">
            {/* Nagłówek */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Panel Super Admina</h1>
                    <p className="text-muted-foreground">Zarządzaj firmami i użytkownikami w całej aplikacji.</p>
                </div>
                <div className="flex gap-2">
                    {/* Tutaj podepniemy modale później */}
                    {activeTab === 'companies' ? (
                        <Button><Plus className="mr-2 h-4 w-4" /> Dodaj Firmę</Button>
                    ) : (
                        <Button><Plus className="mr-2 h-4 w-4" /> Dodaj Użytkownika</Button>
                    )}
                </div>
            </div>

            {/* Statystyki "na szybko" */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Wszystkie Firmy</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{companies.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Wszyscy Użytkownicy</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Pasek zakładek i wyszukiwania */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div className="flex gap-2 bg-muted p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('companies')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            activeTab === 'companies'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Firmy
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            activeTab === 'users'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Użytkownicy
                    </button>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={activeTab === 'companies' ? "Szukaj firmy..." : "Szukaj użytkownika..."}
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabela Firm */}
            {activeTab === 'companies' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Lista Firm</CardTitle>
                        <CardDescription>Podgląd wszystkich firm zarejestrowanych w systemie.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nazwa Firmy</TableHead>
                                    <TableHead>Data utworzenia</TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead className="text-right">Akcje</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCompanies.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8">Brak wyników</TableCell></TableRow>
                                ) : filteredCompanies.map((company) => (
                                    <TableRow key={company.id}>
                                        <TableCell className="font-medium">{company.name || 'Bez nazwy'}</TableCell>
                                        <TableCell>{new Date(company.created_at).toLocaleDateString('pl-PL')}</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{company.id}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Edytuj</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Tabela Użytkowników */}
            {activeTab === 'users' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Lista Użytkowników</CardTitle>
                        <CardDescription>Użytkownicy ze wszystkich firm.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Imię i Nazwisko</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rola</TableHead>
                                    <TableHead className="text-right">Akcje</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8">Brak wyników</TableCell></TableRow>
                                ) : filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.first_name} {user.last_name}
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'super_admin' ? 'destructive' : 'secondary'}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Edytuj</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}