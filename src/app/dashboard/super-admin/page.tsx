'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api'; //
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, Plus, Search, RefreshCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Typy danych z obsługą brakujących pól
interface Company {
    id: string;
    name: string | null;
    created_at: string;
}

interface User {
    id: string;
    email?: string; // Opcjonalne, bo może nie przyjść z backendu
    first_name?: string;
    last_name?: string;
    role?: string;
}

export default function SuperAdminPage() {
    const [activeTab, setActiveTab] = useState<'companies' | 'users'>('companies');
    const [companies, setCompanies] = useState<Company[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            // Pobieramy dane niezależnie
            const companiesPromise = api.get<Company[]>('/super-admin/companies')
                .then(res => setCompanies(res.data))
                .catch(err => console.error('Błąd firm:', err));

            const usersPromise = api.get<User[]>('/super-admin/users')
                .then(res => setUsers(res.data))
                .catch(err => console.error('Błąd userów:', err));

            await Promise.allSettled([companiesPromise, usersPromise]);
        } catch (error) {
            toast.error('Błąd pobierania danych');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ✅ BEZPIECZNE FILTROWANIE (Naprawa Twojego błędu)
    const filteredCompanies = companies.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUsers = users.filter(u => {
        const search = searchTerm.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const lastName = (u.last_name || '').toLowerCase();
        const firstName = (u.first_name || '').toLowerCase();

        return email.includes(search) || lastName.includes(search) || firstName.includes(search);
    });

    return (
        <div className="p-8 space-y-6 h-full overflow-y-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Panel Super Admina</h1>
                    <p className="text-muted-foreground">Zarządzaj firmami i użytkownikami.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    {/* Placeholdery na przyszłe modale */}
                    {activeTab === 'companies' ? (
                        <Button><Plus className="mr-2 h-4 w-4" /> Dodaj Firmę</Button>
                    ) : (
                        <Button><Plus className="mr-2 h-4 w-4" /> Dodaj Użytkownika</Button>
                    )}
                </div>
            </div>

            {/* Statystyki */}
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

            {/* Zakładki i Szukajka */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div className="flex gap-2 bg-muted p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('companies')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            activeTab === 'companies' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Firmy
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            activeTab === 'users' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Użytkownicy
                    </button>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Szukaj..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Widok Firm */}
            {activeTab === 'companies' && (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nazwa Firmy</TableHead>
                                    <TableHead>Data utworzenia</TableHead>
                                    <TableHead className="text-right">Akcje</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCompanies.map((company) => (
                                    <TableRow key={company.id}>
                                        <TableCell className="font-medium">{company.name || 'Bez nazwy'}</TableCell>
                                        <TableCell>{new Date(company.created_at).toLocaleDateString('pl-PL')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Edytuj</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredCompanies.length === 0 && (
                                    <TableRow><TableCell colSpan={3} className="text-center py-4">Brak wyników</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Widok Użytkowników */}
            {activeTab === 'users' && (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Użytkownik</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rola</TableHead>
                                    <TableHead className="text-right">Akcje</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.first_name} {user.last_name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {user.email || <span className="text-red-400 text-xs">Brak (Błąd API)</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{user.role || 'user'}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Edytuj</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="text-center py-4">Brak wyników</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}