'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

export default function CompanyHolidaysModal({ departments, onRefresh }: { departments: any[], onRefresh: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [name, setName] = useState('');
    const [departmentId, setDepartmentId] = useState('all');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/schedules/company-holidays', {
                date,
                name,
                department_id: departmentId === 'all' ? null : departmentId
            });
            toast.success('Dzień wolny dodany pomyślnie!');
            setIsOpen(false);
            onRefresh();
            setName('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Błąd przy dodawaniu');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100">
                    Dni Wolne / Święta Firmowe
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Dodaj Dzień Wolny w Firmie</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label>Data Wolnego</Label>
                        <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Nazwa (np. Integracja, Rocznica)</Label>
                        <Input placeholder="Wpisz nazwę" required value={name} onChange={e => setName(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Dział</Label>
                        <Select value={departmentId} onValueChange={setDepartmentId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz dział" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Cała firma</SelectItem>
                                {departments.map(dept => (
                                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        Zapisz Dzień Wolny
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
