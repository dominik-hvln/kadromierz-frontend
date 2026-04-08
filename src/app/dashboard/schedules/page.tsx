'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShiftRequestsModal from './ShiftRequestsModal';
import ScheduleTableView from './ScheduleTableView';
import AddScheduleModal from './AddScheduleModal';
import EditScheduleModal from './EditScheduleModal';
import ExportButtons from './ExportButtons';
import CompanyHolidaysModal from './CompanyHolidaysModal';

const locales = {
    'pl': pl
};
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export default function SchedulesPage() {
    const { user } = useAuthStore();
    const [events, setEvents] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<View>(Views.MONTH);
    const [isLoading, setIsLoading] = useState(true);
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [departmentUsers, setDepartmentUsers] = useState<any[]>([]);
    
    // For Modals
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [genMonth, setGenMonth] = useState((new Date().getMonth() + 1).toString());
    const [genYear, setGenYear] = useState(new Date().getFullYear().toString());

    useEffect(() => {
        if (user?.role === 'admin' || user?.role === 'manager') {
            api.get('/company-settings/departments').then(res => {
                if (res.data && res.data.length > 0) {
                    setDepartments(res.data);
                    setSelectedDepartment(res.data[0].id);
                }
            });
        }
    }, [user]);

    useEffect(() => {
        if (selectedDepartment) {
            api.get(`/users?department_id=${selectedDepartment}`).then(res => {
                if (res.data) setDepartmentUsers(res.data);
            });
        }
    }, [selectedDepartment]);

    useEffect(() => {
        fetchSchedules(currentDate.getMonth() + 1, currentDate.getFullYear(), selectedDepartment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate, selectedDepartment]);

    const fetchSchedules = async (month: number, year: number, deptId?: string) => {
        setIsLoading(true);
        try {
            let url = `/schedules?month=${month}&year=${year}`;
            if (deptId) url += `&departmentId=${deptId}`;
            const res = await api.get(url);
            if (res.data) {
                const calEvents = res.data.map((s: any) => {
                   const startParts = s.start_time.split(':');
                   const endParts = s.end_time.split(':');
                   const dateParts = s.date.split('-');
                   
                   const startDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], startParts[0], startParts[1]);
                   const endDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], endParts[0], endParts[1]);

                   let title = `${s.shift_name}`;
                   if (user?.role === 'admin' || user?.role === 'manager') {
                       title += ` - ${s.users?.first_name} ${s.users?.last_name}`;
                   }

                   return {
                       id: s.id,
                       title: s.status === 'replacement_needed' ? `[NIEB/L4] ${title}` : title,
                       start: startDate,
                       end: endDate,
                       status: s.status,
                       userId: s.user_id,
                       raw: s
                   };
                const holidaysRes = await api.get(`/schedules/holidays?month=${month}&year=${year}&departmentId=${deptId || ''}`);
                const hEvents = (holidaysRes.data || []).map((h: any) => {
                    const parts = h.date.split('-');
                    const d = new Date(parts[0], parts[1] - 1, parts[2]);
                    return {
                        id: `hol-${h.id || h.date}`,
                        title: `[🎈Wolne] ${h.name}`,
                        start: d,
                        end: d,
                        allDay: true,
                        status: 'holiday',
                        raw: h
                    };
                });
                
                setHolidays(holidaysRes.data || []);
                setEvents([...hEvents, ...calEvents]);
            }
        } catch (error) {
            toast.error('Błąd podczas ładowania grafiku');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedDepartment) {
            toast.error('Wybierz dział, dla którego chcesz wygenerować grafik.');
            return;
        }
        try {
            await api.post('/schedules/generate', { month: parseInt(genMonth), year: parseInt(genYear), department_id: selectedDepartment });
            toast.success('Grafik został wygenerowany pomyślnie!');
            // Refresh
            fetchSchedules(parseInt(genMonth), parseInt(genYear), selectedDepartment);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Błąd przy generowaniu grafiku');
        }
    };

    const eventStyleGetter = (event: any, start: Date, end: Date, isSelected: boolean) => {
        let backgroundColor = '#3174ad';
        if (event.status === 'replacement_needed') {
            backgroundColor = '#e11d48'; // bg-rose-600
        } else if (event.status === 'holiday') {
            backgroundColor = '#f59e0b'; // bg-amber-500
        }
        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block',
            }
        };
    };

    const handleEventClick = (event: any) => {
         if (event.status === 'holiday') {
             toast.info(`Święto: ${event.raw.name}`);
             return;
         }
         
         if (user?.role === 'admin' || user?.role === 'manager') {
              setSelectedEvent(event);
              setIsEditModalOpen(true);
         } else {
              toast.info(`Szczegóły: ${event.title}`);
         }
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Grafik Pracy</h1>
                    <p className="text-muted-foreground">Podgląd zmian pracowniczych.</p>
                </div>
                
                <div className="flex gap-4 items-center">
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                        <div className="flex items-center gap-4">
                            <div className="w-48">
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtruj dział" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="default">Generuj Grafik</Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="space-y-4">
                                        <h4 className="font-medium">Parametry generowania</h4>
                                        <p className="text-sm text-gray-500">Wygeneruje się dla przypisanego działu z filtru obok.</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Miesiąc</Label>
                                                <Input type="number" min="1" max="12" value={genMonth} onChange={e => setGenMonth(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Rok</Label>
                                                <Input type="number" min="2020" max="2050" value={genYear} onChange={e => setGenYear(e.target.value)} />
                                            </div>
                                        </div>
                                        <Button className="w-full" onClick={handleGenerate}>Uruchom automat</Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <CompanyHolidaysModal departments={departments} onRefresh={() => fetchSchedules(parseInt(genMonth), parseInt(genYear), selectedDepartment)} />
                        </div>
                    )}

                    {/* Widoczne dla kazdego */}
                    <ShiftRequestsModal />
                </div>
            </div>

            <div className="glassmorphism-box p-6 flex-1 min-h-[600px] overflow-hidden">
                <Tabs defaultValue="calendar" className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <TabsList>
                            <TabsTrigger value="calendar">Kalendarz</TabsTrigger>
                            { (user?.role === 'admin' || user?.role === 'manager') && (
                                <TabsTrigger value="table">Tabela Miesięczna</TabsTrigger>
                            )}
                        </TabsList>
                        
                        <div className="flex items-center gap-2">
                            <ExportButtons 
                                month={parseInt(genMonth)} 
                                year={parseInt(genYear)} 
                                events={events} 
                                holidays={holidays}
                                departmentId={selectedDepartment} 
                            />
                            {(user?.role === 'admin' || user?.role === 'manager') && (
                                <AddScheduleModal 
                                    users={departmentUsers} 
                                    onRefresh={() => fetchSchedules(parseInt(genMonth), parseInt(genYear), selectedDepartment)} 
                                />
                            )}
                        </div>
                    </div>
                    
                    <TabsContent value="calendar" className="flex-1 mt-0 h-full border rounded-md relative bg-white">
                        <div className="absolute inset-0">
                            <Calendar
                                culture="pl"
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: '100%' }}
                                date={currentDate}
                                onNavigate={date => setCurrentDate(date)}
                                view={currentView}
                                onView={view => setCurrentView(view)}
                                eventPropGetter={eventStyleGetter}
                                onSelectEvent={handleEventClick}
                                messages={{
                                    next: "Następny",
                                    previous: "Poprzedni",
                                    today: "Dziś",
                                    month: "Miesiąc",
                                    week: "Tydzień",
                                    day: "Dzień",
                                    agenda: "Agenda",
                                    noEventsInRange: "Brak zmian w tym okresie."
                                }}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="table" className="flex-1 mt-0">
                        <ScheduleTableView 
                            month={parseInt(genMonth)} 
                            year={parseInt(genYear)} 
                            events={events} 
                            holidays={holidays}
                            departmentId={selectedDepartment} 
                            onRefresh={() => fetchSchedules(parseInt(genMonth), parseInt(genYear), selectedDepartment)}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            {isEditModalOpen && (
                <EditScheduleModal
                    isOpen={isEditModalOpen}
                    onClose={() => { setIsEditModalOpen(false); setSelectedEvent(null); }}
                    event={selectedEvent}
                    users={departmentUsers}
                    onRefresh={() => fetchSchedules(parseInt(genMonth), parseInt(genYear), selectedDepartment)}
                />
            )}
        </div>
    );
}
