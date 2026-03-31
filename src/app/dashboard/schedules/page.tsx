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
import ShiftRequestsModal from './ShiftRequestsModal';

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
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<View>(Views.MONTH);
    const [isLoading, setIsLoading] = useState(true);

    const [genMonth, setGenMonth] = useState((new Date().getMonth() + 1).toString());
    const [genYear, setGenYear] = useState(new Date().getFullYear().toString());

    useEffect(() => {
        fetchSchedules(currentDate.getMonth() + 1, currentDate.getFullYear());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate]);

    const fetchSchedules = async (month: number, year: number) => {
        setIsLoading(true);
        try {
            const res = await api.get(`/schedules?month=${month}&year=${year}`);
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
                });
                setEvents(calEvents);
            }
        } catch (error) {
            toast.error('Błąd podczas ładowania grafiku');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        try {
            await api.post('/schedules/generate', { month: parseInt(genMonth), year: parseInt(genYear) });
            toast.success('Grafik został wygenerowany pomyślnie!');
            // Refresh
            fetchSchedules(parseInt(genMonth), parseInt(genYear));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Błąd przy generowaniu grafiku');
        }
    };

    const eventStyleGetter = (event: any, start: Date, end: Date, isSelected: boolean) => {
        let backgroundColor = '#3174ad';
        if (event.status === 'replacement_needed') {
            backgroundColor = '#e11d48'; // bg-rose-600
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
         // Tu można wyświetlić modal np. z wymianą pracownika
         // Dla uproszczenia, jeśli admin i 'replacement_needed', pokaż toast:
         if ((user?.role === 'admin' || user?.role === 'manager') && event.status === 'replacement_needed') {
              toast.info(`Pracownik ${event.raw?.users?.first_name} zgłosił urlop/L4 na tę datę. Musisz przydzielić zmianę.`);
              // docelowo: otwarcie dialogu edycji schedule -> przypisanie nowego user_id
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
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="default">Generuj Grafik</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="space-y-4">
                                    <h4 className="font-medium">Parametry generowania</h4>
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
                    )}

                    {/* Widoczne dla kazdego */}
                    <ShiftRequestsModal />
                </div>
            </div>

            <div className="glassmorphism-box p-6 flex-1 min-h-[600px] overflow-hidden">
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
        </div>
    );
}
