'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import SchedulesSettingsTab from '@/components/company-settings/SchedulesSettingsTab';

interface Department { id: string; name: string; }
interface Team { id: string; name: string; department_id: string; }
interface FTE { id: string; name: string; multiplier: number; }

export default function CompanySettingsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [ftes, setFtes] = useState<FTE[]>([]);
    
    const [newDeptName, setNewDeptName] = useState('');
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamDeptId, setNewTeamDeptId] = useState('');
    const [newFteName, setNewFteName] = useState('');
    const [newFteMultiplier, setNewFteMultiplier] = useState('');

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        try {
            const [depRes, teamRes, fteRes] = await Promise.all([
                api.get('/company-settings/departments'),
                api.get('/company-settings/teams'),
                api.get('/company-settings/ftes')
            ]);
            setDepartments(depRes.data);
            setTeams(teamRes.data);
            setFtes(fteRes.data);
            if (depRes.data.length > 0 && !newTeamDeptId) setNewTeamDeptId(depRes.data[0].id);
        } catch (error) {
            toast.error('Błąd podczas ładowania danych ustawień');
        }
    };

    const addDepartment = async () => {
        if (!newDeptName) return;
        try {
            await api.post('/company-settings/departments', { name: newDeptName });
            toast.success('Dodano dział');
            setNewDeptName('');
            fetchData();
        } catch(e) { toast.error('Nie udało się dodać działu'); }
    }
    const deleteDepartment = async (id: string) => {
        if(!confirm('Czy na pewno chcesz usunąć ten dział? Działania nie można cofnąć, sprawi to, że pracownicy i zespoły stracą to przypisanie.')) return;
        try {
            await api.delete(`/company-settings/departments/${id}`);
            toast.success('Usunięto dział');
            fetchData();
        } catch(e) { toast.error('Błąd przy usuwaniu'); }
    }

    const addTeam = async () => {
        if (!newTeamName || !newTeamDeptId) return;
        try {
            await api.post('/company-settings/teams', { name: newTeamName, departmentId: newTeamDeptId });
            toast.success('Dodano zespół');
            setNewTeamName('');
            fetchData();
        } catch(e) { toast.error('Nie udało się dodać zespołu'); }
    }
    const deleteTeam = async (id: string) => {
        if(!confirm('Czy na pewno chcesz usunąć ten zespół?')) return;
        try {
            await api.delete(`/company-settings/teams/${id}`);
            toast.success('Usunięto zespół');
            fetchData();
        } catch(e) { toast.error('Błąd przy usuwaniu'); }
    }

    const addFte = async () => {
        const mult = parseFloat(newFteMultiplier.replace(',','.'));
        if (!newFteName || isNaN(mult)) {
            toast.error('Podaj nazwę i prawidłowy mnożnik (np. 1.0, 0.5)');
            return;
        }
        try {
            await api.post('/company-settings/ftes', { name: newFteName, multiplier: mult });
            toast.success('Dodano etat');
            setNewFteName('');
            setNewFteMultiplier('');
            fetchData();
        } catch(e) { toast.error('Nie udało się dodać etatu'); }
    }
    const deleteFte = async (id: string) => {
        if(!confirm('Czy na pewno chcesz usunąć ten wymiar etatu?')) return;
        try {
            await api.delete(`/company-settings/ftes/${id}`);
            toast.success('Usunięto etat');
            fetchData();
        } catch(e) { toast.error('Błąd przy usuwaniu'); }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Ustawienia Kadrowe</h1>
            <p className="text-muted-foreground">Zarządzaj strukturą firmy: działami, zespołami i wymiarami etatów dla pracowników.</p>

            <Tabs defaultValue="departments" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="departments">Działy</TabsTrigger>
                    <TabsTrigger value="teams">Zespoły</TabsTrigger>
                    <TabsTrigger value="ftes">Wymiary etatu</TabsTrigger>
                    <TabsTrigger value="schedules">Grafik Zmian</TabsTrigger>
                </TabsList>

                {/* DEPARTMENTS */}
                <TabsContent value="departments" className="glassmorphism-box p-6 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Zarządzanie Działami</h2>
                        <p className="text-sm text-gray-500 mb-4">Dodawaj duże jednostki organizacyjne, np. Administracja, IT, Magazyn.</p>
                        <div className="flex max-w-lg items-center gap-4">
                            <Input placeholder="Nazwa nowego działu" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} />
                            <Button onClick={addDepartment}>Dodaj Dział</Button>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2 max-w-lg">
                        {departments.map(d => (
                            <div key={d.id} className="flex justify-between items-center p-3 border rounded-md">
                                <span className="font-medium">{d.name}</span>
                                <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" size="icon" onClick={() => deleteDepartment(d.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* TEAMS */}
                <TabsContent value="teams" className="glassmorphism-box p-6 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Zarządzanie Zespołami</h2>
                        <p className="text-sm text-gray-500 mb-4">Dodawaj wchodzące w działy jednostki, np. Zespół Wsparcia L1.</p>
                        <div className="flex max-w-3xl items-center gap-4">
                            <select className="border rounded-md px-3 py-2 text-sm max-w-xs flex-1 bg-background" value={newTeamDeptId} onChange={e => setNewTeamDeptId(e.target.value)}>
                                <option value="" disabled>Wybierz dział organizacyjny</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            <Input placeholder="Nazwa nowego zespołu" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                            <Button onClick={addTeam}>Dodaj Zespół</Button>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2 max-w-3xl">
                        {teams.map(t => (
                            <div key={t.id} className="flex justify-between items-center p-3 border rounded-md">
                                <div>
                                    <span className="font-medium">{t.name}</span> 
                                    <span className="text-muted-foreground text-sm ml-2">Dział: {departments.find(d => d.id === t.department_id)?.name}</span>
                                </div>
                                <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" size="icon" onClick={() => deleteTeam(t.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* FTES */}
                <TabsContent value="ftes" className="glassmorphism-box p-6 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Słownik wymiarów etatu</h2>
                        <p className="text-sm text-gray-500 mb-4">Definiuj wymiary np. dla pełnego etatu (Nazwa: 1/1, Mnożnik: 1.0) lub pół etatu (Nazwa: 1/2, Mnożnik: 0.5)</p>
                        <div className="flex max-w-3xl items-center gap-4">
                            <Input placeholder="Etykieta (np. 1/1)" value={newFteName} onChange={e => setNewFteName(e.target.value)} className="w-1/3" />
                            <Input placeholder="Mnożnik (np. 1.0)" type="text" value={newFteMultiplier} onChange={e => setNewFteMultiplier(e.target.value)} className="w-1/3" />
                            <Button onClick={addFte} className="flex-1">Dodaj Etat</Button>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2 max-w-3xl">
                        {ftes.map(f => (
                            <div key={f.id} className="flex justify-between items-center p-3 border rounded-md">
                                <div>
                                    <span className="font-medium">{f.name}</span> 
                                    <span className="text-muted-foreground text-sm ml-2">Mnożnik do wyliczania: {f.multiplier}</span>
                                </div>
                                <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" size="icon" onClick={() => deleteFte(f.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* SCHEDULES */}
                <TabsContent value="schedules" className="glassmorphism-box p-6 space-y-6">
                    <SchedulesSettingsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
