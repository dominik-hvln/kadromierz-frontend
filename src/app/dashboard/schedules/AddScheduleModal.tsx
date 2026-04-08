'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AddScheduleModal({ onRefresh, users }: { onRefresh: () => void, users: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [userId, setUserId] = useState('');
    const [date, setDate] = useState('');
    const [shiftName, setShiftName] = useState('');
    const [startTime, setStartTime] = useState('06:00');
    const [endTime, setEndTime] = useState('14:00');

    const handleSave = async () => {
        if (!userId || !date || !shiftName || !startTime || !endTime) {
            toast.error('Wypełnij wszystkie pola');
            return;
        }

        try {
            await api.post('/schedules', {
                user_id: userId,
                date,
                shift_name: shiftName,
                start_time: startTime,
                end_time: endTime,
                status: 'scheduled'
            });
            toast.success('Dodano zmianę');
            setIsOpen(false);
            onRefresh();
        } catch (e) {
            toast.error('Błąd podczas zapisywania');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">+ Dodaj ręcznie zmianę</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Dodaj manualnie zmianę do grafiku</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Pracownik</Label>
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
                        <Label>Data</Label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Nazwa zmiany</Label>
                        <Input placeholder="np. Zmiana Ranna" value={shiftName} onChange={e => setShiftName(e.target.value)} />
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
                    <Button className="w-full mt-4" onClick={handleSave}>Zapisz</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
