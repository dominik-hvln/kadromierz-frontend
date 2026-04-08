'use client';

import React, { useMemo } from 'react';
import { getDaysInMonth, format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ScheduleTableViewProps {
    month: number;
    year: number;
    events: any[];
    holidays: any[];
    departmentId: string;
    onRefresh: () => void;
}

export default function ScheduleTableView({ month, year, events, holidays = [], departmentId, onRefresh }: ScheduleTableViewProps) {
    const daysInMonth = useMemo(() => {
        const date = new Date(year, month - 1, 1);
        const count = getDaysInMonth(date);
        return Array.from({ length: count }, (_, i) => new Date(year, month - 1, i + 1));
    }, [month, year]);

    const usersMap = useMemo(() => {
        const map = new Map();
        events.forEach(e => {
            if (!map.has(e.userId) && e.raw?.users) {
                map.set(e.userId, e.raw.users);
            }
        });
        return Array.from(map.values()).sort((a, b) => a.last_name.localeCompare(b.last_name));
    }, [events]);

    const getEventForDay = (userId: string, date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return events.find(e => e.userId === userId && e.raw?.date === dateStr);
    };

    if (!departmentId) {
        return <div className="p-8 text-center text-gray-500">Wybierz dział, aby zobaczyć tabelę grafiku.</div>;
    }

    if (usersMap.length === 0) {
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
                            return (
                                <th 
                                    key={day.toISOString()} 
                                    className={`p-2 border-r text-center min-w-[60px] ${isWeekend ? 'bg-red-50 text-red-600' : ''}`}
                                >
                                    <div>{format(day, 'dd')}</div>
                                    <div className="text-[10px] font-normal text-muted-foreground">{format(day, 'E', { locale: pl }).toUpperCase()}</div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {usersMap.map(user => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 border-r sticky left-0 bg-white z-10 font-medium">
                                {user.first_name} {user.last_name}
                            </td>
                            {daysInMonth.map(day => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const ev = getEventForDay(user.id, day);
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                const isHoliday = holidays.find(h => h.date === dateStr);
                                
                                let bgClass = isWeekend ? 'bg-red-50/30' : '';
                                let text = '-';
                                let textColor = 'text-gray-300';
                                
                                if (isHoliday) {
                                    bgClass = 'bg-amber-50';
                                    textColor = 'text-amber-600 font-bold';
                                    text = 'WOLNE';
                                } else if (ev) {
                                    if (ev.status === 'replacement_needed') {
                                        bgClass = 'bg-rose-100';
                                        textColor = 'text-rose-700 font-bold';
                                        text = 'L4/URL';
                                    } else {
                                        bgClass = 'bg-blue-50';
                                        textColor = 'text-blue-700 font-medium';
                                        text = ev.raw.shift_name.length > 3 ? ev.raw.shift_name.substring(0, 3) + '.' : ev.raw.shift_name;
                                    }
                                }

                                return (
                                    <td 
                                        key={day.toISOString()} 
                                        className={`p-2 border-r text-center ${bgClass} ${textColor} text-xs`}
                                        title={isHoliday ? isHoliday.name : (ev ? `${ev.raw.shift_name} (${ev.raw.start_time} - ${ev.raw.end_time})` : 'Brak przypisania')}
                                    >
                                        {text}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
