'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EditScheduleModal({ event, isOpen, onClose, onRefresh, users }: { event: any, isOpen: boolean, onClose: () => void, onRefresh: () => void, users: any[] }) {
    const [userId, setUserId] = useState('');
    const [shiftName, setShiftName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (event) {
            setUserId(event.userId || '');
            setShiftName(event.raw?.shift_name || '');
            setStartTime(event.raw?.start_time || '');
            setEndTime(event.raw?.end_time || '');
            setStatus(event.raw?.status || 'scheduled');
        }
    }, [event]);

    const handleSave = async () => {
        if (!shiftName || !startTime || !endTime) {
            toast.error('Wypełnij wszystkie pola');
            return;
        }

        try {
            await api.put(`/schedules/${event.id}`, {
                user_id: userId,
                shift_name: shiftName,
                start_time: startTime,
                end_time: endTime,
                status
            });
            toast.success('Zaktualizowano zmianę');
            onClose();
            onRefresh();
        } catch (e) {
            toast.error('Błąd podczas edycji');
        }
    };
    
    const handleDelete = async () => {
        if (confirm('Czy na pewno chcesz usunąć tę zmianę?')) {
            try {
                await api.delete(`/schedules/${event.id}`);
                toast.success('Skasowano zmianę');
                onClose();
                onRefresh();
            } catch (e) {
                toast.error('Brak możliwości skasowania');
            }
        }
    }

    if (!event) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edytuj przypisanie do grafiku</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Pracownik (Zmień, aby przypisać zastępstwo)</Label>
                        <select 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                        >
                            <option value="">Wybierz pracownika</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Nazwa zmiany</Label>
                        <Input value={shiftName} onChange={e => setShiftName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Od (HH:mm)</Label>
                            <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Do (HH:mm)</Label>
                            <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                        </div>
                    </div>
                    
                    <div className="flex justify-between mt-4">
                        <Button variant="destructive" onClick={handleDelete}>Usuń wpis</Button>
                        <Button onClick={handleSave}>Zapisz zmiany</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
