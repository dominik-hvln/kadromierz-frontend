'use client';

import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Absence } from '@/app/dashboard/absences/page';
import { useMemo } from 'react';

const locales = {
  'pl': pl,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Props {
    absences: Absence[];
}

export default function TeamCalendar({ absences }: Props) {
    const events = useMemo(() => {
        return absences.map(a => {
            // react-big-calendar is exclusive on end date. If an absence is 1 day, start=end.
            // We need to add 1 day to the end date for all-day events so they render properly.
            const startDate = new Date(a.start_date);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(a.end_date);
            endDate.setHours(23, 59, 59, 999);

            let title = `${a.user?.first_name} ${a.user?.last_name || ''}`;
            if (a.type === 'l4') title += ' (L4)';
            if (a.type === 'urlop_na_zadanie') title += ' (NŻ)';

            return {
                id: a.id,
                title: title,
                start: startDate,
                end: endDate,
                allDay: true,
                resource: a,
            };
        });
    }, [absences]);

    const eventStyleGetter = (event: any) => {
        const absence = event.resource as Absence;
        let backgroundColor = '#3b82f6'; // blue-500 for normal
        
        if (absence.status === 'pending') {
            backgroundColor = '#f59e0b'; // amber-500
        } else if (absence.status === 'rejected') {
            backgroundColor = '#ef4444'; // red-500
        } else if (absence.type === 'l4') {
            backgroundColor = '#d946ef'; // fuchsia-500
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    return (
        <div style={{ height: '700px' }} className="calendar-wrapper">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                eventPropGetter={eventStyleGetter}
                culture="pl"
                messages={{
                    next: "Następnie",
                    previous: "Poprzednio",
                    today: "Dzisiaj",
                    month: "Miesiąc",
                    week: "Tydzień",
                    day: "Dzień",
                    agenda: "Plan",
                    date: "Data",
                    time: "Czas",
                    event: "Wydarzenie",
                    noEventsInRange: "Brak nieobecności w tym okresie."
                }}
            />
            
            <div className="mt-4 flex gap-4 text-sm text-gray-600 border-t pt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div> Zaakceptowany Urlop
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div> Oczekujący
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-fuchsia-500"></div> L4
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div> Odrzucony
                </div>
            </div>
            
            <style jsx global>{`
                .rbc-calendar {
                    font-family: inherit;
                }
                .rbc-toolbar button {
                    border-radius: 6px;
                }
                .rbc-toolbar button.rbc-active {
                    background-color: var(--primary);
                    color: white;
                }
                .rbc-event {
                    padding: 2px 5px;
                }
            `}</style>
        </div>
    );
}
