'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ShiftRequestsModal() {
    const { user } = useAuthStore();
    const [requests, setRequests] = useState<any[]>([]);
    const [newDate, setNewDate] = useState('');
    const [newShiftName, setNewShiftName] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchRequests();
        }
    }, [isOpen]);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/schedules/requests');
            setRequests(res.data);
        } catch (e) {
            toast.error('Błąd pobierania dyspozycji');
        }
    };

    const handleSubmit = async () => {
        if (!newDate || !newShiftName) {
            toast.error('Wypełnij wszystkie pola');
            return;
        }
        try {
            await api.post('/schedules/requests', {
                date: newDate,
                requested_shift_name: newShiftName,
            });
            toast.success('Wysłano dyspozycję');
            setNewDate('');
            setNewShiftName('');
            fetchRequests();
        } catch (e) {
            toast.error('Błąd podczas wysyłania');
        }
    };

    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await api.put(`/schedules/requests/${id}/status`, { status });
            toast.success('Zaktualizowano status');
            fetchRequests();
        } catch (e) {
            toast.error('Błąd aktualizacji statutu');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Zarządzaj Dyspozycjami</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Dyspozycje zmian</DialogTitle>
                    <DialogDescription>
                        {user?.role === 'employee' 
                            ? 'Zgłoś chęć pracy na określonej zmianie. Twój manager spróbuje uwzględnić Twoją prośbę przy generowaniu grafiku.'
                            : 'Zatwierdzaj lub odrzucaj prośby pracowników o daną zmianę.'}
                    </DialogDescription>
                </DialogHeader>

                {user?.role === 'employee' && (
                    <div className="flex gap-4 items-end mb-6">
                        <div className="flex-1 space-y-2">
                            <Label>Data (np. poniedziałek dla danego tygodnia)</Label>
                            <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label>Nazwa proponowanej zmiany</Label>
                            <Input placeholder="np. 1 Zmiana" value={newShiftName} onChange={e => setNewShiftName(e.target.value)} />
                        </div>
                        <Button onClick={handleSubmit}>Wyślij</Button>
                    </div>
                )}

                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {requests.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">Brak dyspozycji w systemie.</p>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md">
                                <div>
                                    <p className="font-medium text-sm">Pracownik: {req.users?.first_name} {req.users?.last_name}</p>
                                    <p className="text-xs text-muted-foreground">Oczekiwana zmiana: <strong>{req.requested_shift_name}</strong> na dzień {req.date}</p>
                                    <div className="mt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            req.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                            req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            Status: {req.status}
                                        </span>
                                    </div>
                                </div>
                                {(user?.role === 'admin' || user?.role === 'manager') && req.status === 'pending' && (
                                    <div className="flex gap-2 mt-2 sm:mt-0">
                                        <Button size="sm" variant="outline" className="text-green-600 bg-green-50" onClick={() => handleUpdateStatus(req.id, 'approved')}>Zatwierdź</Button>
                                        <Button size="sm" variant="outline" className="text-red-600 bg-red-50" onClick={() => handleUpdateStatus(req.id, 'rejected')}>Odrzuć</Button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
