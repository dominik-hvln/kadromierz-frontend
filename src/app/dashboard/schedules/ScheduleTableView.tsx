'use client';

import React, { useMemo } from 'react';
import { getDaysInMonth, format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    ScheduleOverlay,
    SCHEDULE_LEGEND,
    collectScheduleUsers,
    indexOverlay,
    resolveScheduleCell,
} from '@/lib/schedule-display';

interface ScheduleTableViewProps {
    month: number;
    year: number;
    events: any[];
    holidays: any[];
    overlay: ScheduleOverlay;
    departmentId: string;
    onRefresh: () => void;
}

export default function ScheduleTableView({ month, year, events, holidays = [], overlay, departmentId }: ScheduleTableViewProps) {
    const daysInMonth = useMemo(() => {
        const date = new Date(year, month - 1, 1);
        const count = getDaysInMonth(date);
        return Array.from({ length: count }, (_, i) => new Date(year, month - 1, i + 1));
    }, [month, year]);

    // Tabela jest widokiem managera/admina — pokazujemy też wnioski oczekujące.
    const users = useMemo(() => collectScheduleUsers(events, overlay, true), [events, overlay]);
    const absenceIndex = useMemo(() => indexOverlay(overlay), [overlay]);

    const getEventForDay = (userId: string, dateStr: string) =>
        events.find(e => e.userId === userId && e.raw?.date === dateStr);

    if (!departmentId) {
        return <div className="p-8 text-center text-gray-500">Wybierz dział, aby zobaczyć tabelę grafiku.</div>;
    }

    if (users.length === 0) {
        return <div className="p-8 text-center text-gray-500">Brak danych do wyświetlenia (grafik pusty lub brak pracowników w dziale).</div>;
    }

    return (
        <div id="printable-schedule-table" className="overflow-x-auto border rounded-sm bg-white p-2">
            <h2 className="text-xl font-bold mb-4 hidden print:block text-center">
                Grafik Pracy: {month}/{year}
            </h2>
            <table className="w-full text-sm border-collapse bg-white">
                <thead>
                    <tr className="bg-gray-50 border-b">
                        <th className="p-2 border-r sticky left-0 bg-gray-50 z-10 w-48 text-left">Pracownik</th>
                        {daysInMonth.map(day => {
                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                            const isHoliday = holidays.some(h => h.date === format(day, 'yyyy-MM-dd'));
                            return (
                                <th
                                    key={day.toISOString()}
                                    className={`p-2 border-r text-center min-w-[60px] ${isHoliday ? 'bg-amber-50 text-amber-700' : isWeekend ? 'bg-red-50 text-red-600' : ''}`}
                                >
                                    <div>{format(day, 'dd')}</div>
                                    <div className="text-[10px] font-normal text-muted-foreground">{format(day, 'E', { locale: pl }).toUpperCase()}</div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 border-r sticky left-0 bg-white z-10 font-medium">
                                {user.first_name} {user.last_name}
                            </td>
                            {daysInMonth.map(day => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                const holiday = holidays.find(h => h.date === dateStr);
                                const cell = resolveScheduleCell({
                                    event: getEventForDay(user.id, dateStr),
                                    absencePending: absenceIndex.get(`${user.id}|${dateStr}`),
                                    holiday,
                                    isWeekend,
                                    workOnWeekends: overlay.workOnWeekends,
                                    workOnHolidays: overlay.workOnHolidays,
                                    includePending: true,
                                });

                                let bgClass = isWeekend ? 'bg-red-50/30' : '';
                                let textColor = 'text-gray-300';
                                let text = '-';
                                let title = 'Brak przypisania';

                                if (cell.kind === 'absence') {
                                    bgClass = cell.pending ? 'bg-violet-50' : 'bg-violet-100';
                                    textColor = cell.pending ? 'text-violet-500 font-bold' : 'text-violet-700 font-bold';
                                    text = cell.label;
                                    title = cell.pending
                                        ? 'Wniosek o nieobecność oczekuje na akceptację'
                                        : `Nieobecność${cell.needsReplacement ? ' — zmiana wymaga zastępstwa' : ''}${cell.plannedHours ? ` (planowana zmiana ${cell.plannedHours})` : ''}`;
                                } else if (cell.kind === 'holiday') {
                                    bgClass = 'bg-amber-50';
                                    textColor = 'text-amber-600 font-bold';
                                    text = cell.label;
                                    title = cell.holidayName;
                                } else if (cell.kind === 'shift') {
                                    bgClass = cell.isHoliday ? 'bg-amber-50' : 'bg-blue-50';
                                    textColor = 'text-blue-700 font-medium';
                                    text = cell.hours;
                                    title = `${cell.shiftName} (${cell.hours})${cell.holidayName ? ` — praca w święto: ${cell.holidayName}` : ''}`;
                                } else if (cell.isHoliday) {
                                    bgClass = 'bg-amber-50/50';
                                }

                                return (
                                    <td
                                        key={day.toISOString()}
                                        className={`p-2 border-r text-center ${bgClass} ${textColor} text-xs`}
                                        title={title}
                                    >
                                        {text}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                <span>{SCHEDULE_LEGEND.absence}</span>
                <span>{SCHEDULE_LEGEND.replacement}</span>
                <span>{SCHEDULE_LEGEND.pending}</span>
                {!overlay.workOnHolidays && <span>{SCHEDULE_LEGEND.holiday}</span>}
            </div>
        </div>
    );
}
