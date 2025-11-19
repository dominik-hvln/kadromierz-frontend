'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Company {
    id: string;
    name: string;
}

interface CreateUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);

    // Stan formularza
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'employee',
        companyId: '',
    });

    // Pobieramy firmy przy otwarciu modala
    useEffect(() => {
        if (open) {
            api.get('/super-admin/companies')
                .then((res) => setCompanies(res.data))
                .catch(() => toast.error('Nie udało się pobrać listy firm'));
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/super-admin/users', formData);
            toast.success('Użytkownik został utworzony');
            onSuccess();
            onOpenChange(false);
            // Reset formularza
            setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'employee', companyId: '' });
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Błąd tworzenia użytkownika');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>Dodaj nowego użytkownika</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Imię</Label>
                            <Input
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nazwisko</Label>
                            <Input
                                required
                                value={formData.lastName}
                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Hasło</Label>
                        <Input
                            type="password"
                            required
                            minLength={8}
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Rola</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(val) => setFormData({...formData, role: val})}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="employee">Pracownik</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="admin">Admin Firmy</SelectItem>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Firma</Label>
                            <Select
                                value={formData.companyId}
                                onValueChange={(val) => setFormData({...formData, companyId: val})}
                                disabled={formData.role === 'super_admin'} // Super Admin może nie mieć firmy
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz firmę" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name || 'Bez nazwy'}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Tworzenie...' : 'Utwórz konto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}