'use client';

import { useEffect, useState } from 'react';
import { superAdminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

export default function PlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [newPlan, setNewPlan] = useState({
        code: '',
        name: '',
        price_monthly: 0,
        price_yearly: 0,
        limits: {},
        is_active: true
    });
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [p, m] = await Promise.all([
                superAdminApi.getPlans(),
                superAdminApi.getModules()
            ]);
            setPlans(p);
            setModules(m);
        } catch (error) {
            console.error(error);
            toast.error('Błąd pobierania danych');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async () => {
        try {
            await superAdminApi.createPlan(newPlan);
            toast.success('Plan utworzony');
            setIsDialogOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Błąd tworzenia planu');
        }
    };

    if (loading) return <div>Ładowanie...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Plany i Moduły</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>Dodaj Nowy Plan</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nowy Plan Subskrypcyjny</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input placeholder="Kod (np. basic)" value={newPlan.code} onChange={e => setNewPlan({ ...newPlan, code: e.target.value })} />
                            <Input placeholder="Nazwa (np. Basic Plan)" value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} />
                            <Input type="number" placeholder="Cena miesięczna" value={newPlan.price_monthly} onChange={e => setNewPlan({ ...newPlan, price_monthly: Number(e.target.value) })} />
                            <Input type="number" placeholder="Cena roczna" value={newPlan.price_yearly} onChange={e => setNewPlan({ ...newPlan, price_yearly: Number(e.target.value) })} />
                            <Button onClick={handleCreatePlan} className="w-full">Utwórz Plan</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* LISTA PLANÓW */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Dostępne Plany</h2>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nazwa</TableHead>
                                <TableHead>Kod</TableHead>
                                <TableHead>Cena (M/R)</TableHead>
                                <TableHead>Aktywny</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                    <TableCell>{plan.code}</TableCell>
                                    <TableCell>{plan.price_monthly} zł / {plan.price_yearly} zł</TableCell>
                                    <TableCell>
                                        {plan.is_active ? <Check className="text-green-500 w-5 h-5" /> : <X className="text-red-500 w-5 h-5" />}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* LISTA MODUŁÓW */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Dostępne Moduły Systemowe</h2>
                    <div className="text-sm text-gray-500 mb-4">
                        To są definicje funkcji, które można włączać w planach lub per firma.
                    </div>
                    <ul className="space-y-3">
                        {modules.map((mod) => (
                            <li key={mod.code} className="p-3 border rounded-md">
                                <div className="font-medium text-indigo-700">{mod.name}</div>
                                <div className="text-xs text-gray-500 font-mono mt-1">{mod.code}</div>
                                <div className="text-sm mt-1">{mod.description}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
