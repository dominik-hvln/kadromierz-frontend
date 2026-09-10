'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreateUserForm } from '@/components/users/CreateUserForm';
import { EditUserForm } from '@/components/users/EditUserForm';
import { Pencil, Trash2, Archive, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';

interface User { id: string; first_name: string; last_name: string; email: string; role: string; [key: string]: any; }

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [archivedUsers, setArchivedUsers] = useState<User[]>([]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Błąd podczas pobierania projektów:', error);
        } finally {
            setIsLoading(false);
        }
    };
    const fetchArchivedUsers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/users/archived');
            setArchivedUsers(response.data);
        } catch (error) {
            toast.error('Nie udało się pobrać archiwum pracowników');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    useEffect(() => {
        if (showArchived) fetchArchivedUsers();
    }, [showArchived]);
    
    const handleUserCreated = () => { setIsDialogOpen(false); fetchUsers(); };
    
    const handleDelete = async (user: User) => {
        const confirmed = confirm(
            `Zarchiwizować pracownika: ${user.first_name} ${user.last_name}?\n\n` +
            `Zniknie z list i straci dostęp do aplikacji - jego konto logowania zostanie ` +
            `trwale usunięte.\n\nEwidencja czasu pracy zostaje zachowana i pozostaje ` +
            `dostępna w raportach. Operacji nie da się cofnąć - przywrócenie takiej osoby ` +
            `wymaga założenia konta od nowa.`
        );
        if (!confirmed) return;
        try {
            await api.delete(`/users/${user.id}`);
            toast.success('Pracownik zarchiwizowany. Jego ewidencja czasu pracy została zachowana.');
            fetchUsers();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Błąd przy archiwizacji pracownika');
        }
    };

    const openEdit = (user: User) => {
        setSelectedUser(user);
        setIsEditDialogOpen(true);
    };

    const handleEditSuccess = () => {
        setIsEditDialogOpen(false);
        fetchUsers();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Użytkownicy</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setShowArchived((v) => !v)}>
                        {showArchived
                            ? <><UsersIcon className="h-4 w-4 mr-2" /> Pokaż aktywnych</>
                            : <><Archive className="h-4 w-4 mr-2" /> Archiwum</>}
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild><Button>Dodaj użytkownika</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Nowy użytkownik</DialogTitle></DialogHeader><CreateUserForm onSuccess={handleUserCreated} managers={users.filter(u => u.role === 'admin' || u.role === 'manager')} /></DialogContent>
                    </Dialog>
                </div>
            </div>
            {showArchived && (
                <p className="text-sm text-muted-foreground mb-4">
                    Pracownicy, którzy zakończyli współpracę. Nie mają dostępu do aplikacji,
                    ale ich ewidencja czasu pracy pozostaje zachowana i widoczna w raportach
                    za okresy, w których pracowali.
                </p>
            )}

            <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader><TableRow><TableHead>Imię i nazwisko</TableHead><TableHead>E-mail</TableHead><TableHead>Rola</TableHead><TableHead className="text-right">{showArchived ? 'Zarchiwizowano' : 'Akcje'}</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Ładowanie…</TableCell></TableRow>
                        ) : (showArchived ? archivedUsers : users).length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                {showArchived ? 'Archiwum jest puste.' : 'Brak pracowników.'}
                            </TableCell></TableRow>
                        ) : (showArchived ? archivedUsers : users).map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    {showArchived ? (
                                        <span className="text-sm text-muted-foreground">
                                            {user.archived_at ? new Date(user.archived_at).toLocaleDateString('pl-PL') : '—'}
                                        </span>
                                    ) : (
                                        <>
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" title="Zarchiwizuj pracownika" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(user)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader><DialogTitle>Edycja pracownika</DialogTitle></DialogHeader>
                    {selectedUser && <EditUserForm user={selectedUser} onSuccess={handleEditSuccess} managers={users.filter(u => u.role === 'admin' || u.role === 'manager')} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}