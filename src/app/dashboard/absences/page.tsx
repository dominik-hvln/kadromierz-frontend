'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Clock, Plus, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import CreateAbsenceForm from '@/components/absences/CreateAbsenceForm';
import AbsencesTable from '@/components/absences/AbsencesTable';
import TeamCalendar from '@/components/absences/TeamCalendar';

export interface Absence {
    id: string;
    company_id: string;
    user_id: string;
    type: string;
    start_date: string;
    end_date: string;
    status: 'pending' | 'approved' | 'rejected';
    reason: string | null;
    reviewed_by: string | null;
    created_at: string;
    user?: { id: string; first_name: string; last_name: string; manager_id: string | null };
    reviewer?: { id: string; first_name: string; last_name: string } | null;
}

export default function AbsencesPage() {
    const { user } = useAuthStore();
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'super_admin';

    const fetchAbsences = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/absences');
            setAbsences(response.data);
        } catch (error) {
            toast.error('Nie udało się pobrać nieobecności');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAbsences();
    }, [fetchAbsences]);

    const handleSuccess = () => {
        setIsCreateModalOpen(false);
        fetchAbsences();
    };

    const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await api.patch(`/absences/${id}/status`, { status });
            toast.success(`Wniosek został ${status === 'approved' ? 'zaakceptowany' : 'odrzucony'}`);
            fetchAbsences();
        } catch (error) {
            toast.error('Błąd podczas zmiany statusu');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Czy na pewno anulować ten wniosek?')) return;
        try {
            await api.delete(`/absences/${id}`);
            toast.success('Wniosek usunięty');
            fetchAbsences();
        } catch (error) {
            toast.error('Błąd usuwania wniosku');
        }
    };

    const myAbsences = absences.filter(a => a.user_id === user?.id);
    const teamAbsences = absences.filter(a => a.user_id !== user?.id);
    const pendingRequests = teamAbsences.filter(a => a.status === 'pending');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kalendarz Nieobecności</h1>
                    <p className="text-muted-foreground mt-1">
                        Zarządzaj urlopami, zwolnieniami L4 i innymi nieobecnościami.
                    </p>
                </div>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Zgłoś nieobecność
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nowy wniosek</DialogTitle>
                        </DialogHeader>
                        <CreateAbsenceForm onSuccess={handleSuccess} />
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="calendar" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="calendar" className="gap-2"><CalendarIcon className="h-4 w-4" /> Kalendarz graficzny</TabsTrigger>
                    <TabsTrigger value="my" className="gap-2"><Clock className="h-4 w-4" /> Moje wnioski</TabsTrigger>
                    {isManagerOrAdmin && (
                        <TabsTrigger value="pending" className="gap-2">
                            <CheckCircle className="h-4 w-4" /> 
                            Do akceptacji u podwładnych
                            {pendingRequests.length > 0 && (
                                <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </TabsTrigger>
                    )}
                    {isManagerOrAdmin && (
                        <TabsTrigger value="team" className="gap-2"><UsersIcon className="h-4 w-4" /> Historia zespołu</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="calendar" className="mt-0">
                    <div className="bg-card text-card-foreground border rounded-xl overflow-hidden shadow-sm p-4">
                        <TeamCalendar absences={absences} />
                    </div>
                </TabsContent>

                <TabsContent value="my" className="mt-0">
                    <div className="bg-card text-card-foreground border rounded-xl overflow-hidden shadow-sm">
                        <AbsencesTable 
                            absences={myAbsences} 
                            isLoading={isLoading} 
                            onDelete={handleDelete}
                            isManagerView={false}
                        />
                    </div>
                </TabsContent>

                {isManagerOrAdmin && (
                    <>
                        <TabsContent value="pending" className="mt-0">
                            <div className="bg-card text-card-foreground border rounded-xl overflow-hidden shadow-sm">
                                <AbsencesTable 
                                    absences={pendingRequests} 
                                    isLoading={isLoading} 
                                    onStatusChange={handleStatusChange}
                                    isManagerView={true}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="team" className="mt-0">
                            <div className="bg-card text-card-foreground border rounded-xl overflow-hidden shadow-sm">
                                <AbsencesTable 
                                    absences={teamAbsences} 
                                    isLoading={isLoading} 
                                    onStatusChange={handleStatusChange}
                                    isManagerView={true}
                                />
                            </div>
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
}

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
