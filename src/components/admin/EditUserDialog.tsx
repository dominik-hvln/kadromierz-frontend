'use client';

import { useEffect, useState } from 'react';
import { superAdminApi } from '@/lib/api';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

interface Company {
    id: string;
    name: string | null;
}

interface EditUserDialogProps {
    user: any | null;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditUserDialog({ user, onOpenChange, onSuccess }: EditUserDialogProps) {
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [form, setForm] = useState({ firstName: '', lastName: '', role: 'employee', companyId: '' });

    useEffect(() => {
        if (!user) return;
        setForm({
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            role: user.role || 'employee',
            companyId: user.company_id || '',
        });
        superAdminApi
            .getCompanies()
            .then(setCompanies)
            .catch(() => toast.error('Nie udało się pobrać listy firm'));
    }, [user]);

    const isSuperAdmin = form.role === 'super_admin';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!isSuperAdmin && !form.companyId) {
            toast.error('Wybierz firmę — tylko super admin może być bez przypisania.');
            return;
        }

        setLoading(true);
        try {
            await superAdminApi.updateUser(user.id, {
                firstName: form.firstName,
                lastName: form.lastName,
                role: form.role,
                companyId: isSuperAdmin ? null : form.companyId,
            });
            toast.success('Zapisano zmiany');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            toast.error(err.response?.data?.message || 'Błąd zapisu użytkownika');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>Edycja użytkownika</DialogTitle>
                    </DialogHeader>

                    <p className="text-sm text-muted-foreground">{user?.email}</p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Imię</Label>
                            <Input
                                value={form.firstName}
                                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nazwisko</Label>
                            <Input
                                value={form.lastName}
                                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Rola</Label>
                            <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val })}>
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
                                value={form.companyId}
                                onValueChange={(val) => setForm({ ...form, companyId: val })}
                                disabled={isSuperAdmin}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isSuperAdmin ? 'Bez firmy' : 'Wybierz firmę'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name || 'Bez nazwy'}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {isSuperAdmin && (
                        <p className="text-xs text-muted-foreground">
                            Super admin działa globalnie i zostanie odpięty od firmy.
                        </p>
                    )}

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Zapisywanie...' : 'Zapisz'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
