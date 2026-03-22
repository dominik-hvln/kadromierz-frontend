'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreateUserForm } from '@/components/users/CreateUserForm';
import { EditUserForm } from '@/components/users/EditUserForm';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface User { id: string; first_name: string; last_name: string; email: string; role: string; [key: string]: any; }

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
    useEffect(() => { fetchUsers(); }, []);
    
    const handleUserCreated = () => { setIsDialogOpen(false); fetchUsers(); };
    
    const handleDelete = async (user: User) => {
        if (!confirm(`Czy na pewno usunąć pracownika: ${user.first_name} ${user.last_name}? To bezpowrotnie usunie przypisany czas pracy.`)) return;
        try {
            await api.delete(`/users/${user.id}`);
            toast.success('Pracownik usunięty');
            fetchUsers();
        } catch (error) {
            toast.error('Błąd przy usuwaniu pracownika');
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
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild><Button>Dodaj użytkownika</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Nowy użytkownik</DialogTitle></DialogHeader><CreateUserForm onSuccess={handleUserCreated} managers={users.filter(u => u.role === 'admin' || u.role === 'manager')} /></DialogContent>
                </Dialog>
            </div>
            <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader><TableRow><TableHead>Imię i nazwisko</TableHead><TableHead>E-mail</TableHead><TableHead>Rola</TableHead><TableHead className="text-right">Akcje</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(user)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
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