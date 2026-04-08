'use client';

import React, { useMemo } from 'react';
import { getDaysInMonth, format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface SingleUserPrintProps {
    month: number;
    year: number;
    events: any[];
    holidays: any[];
    user: any;
}

export default function SingleUserPrint({ month, year, events, holidays, user }: SingleUserPrintProps) {
    const daysInMonth = useMemo(() => {
        const date = new Date(year, month - 1, 1);
        const count = getDaysInMonth(date);
        return Array.from({ length: count }, (_, i) => new Date(year, month - 1, i + 1));
    }, [month, year]);

    if (!user) return null;

    return (
        <div id="printable-single-user" className="hidden print:block absolute top-0 left-0 w-full bg-white text-black p-8 z-50">
            <div className="text-center mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold uppercase tracking-wider">Miesięczny Grafik Pracy</h1>
                <p className="text-xl mt-2">{user.first_name} {user.last_name}</p>
                <p className="text-gray-500">{format(new Date(year, month - 1, 1), 'LLLL yyyy', { locale: pl }).toUpperCase()}</p>
            </div>
            
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="p-3 w-20">Data</th>
                        <th className="p-3 w-32">Dzień</th>
                        <th className="p-3">Status / Zmiana</th>
                        <th className="p-3 w-32">Godziny</th>
                    </tr>
                </thead>
                <tbody>
                    {daysInMonth.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        const isHoliday = holidays.find(h => h.date === dateStr);
                        const ev = events.find(e => e.userId === user.id && e.raw?.date === dateStr);

                        let rowClass = 'border-b';
                        if (isWeekend) rowClass += ' bg-red-50';
                        if (isHoliday) rowClass += ' bg-amber-50';

                        let status = '-';
                        let hours = '-';

                        if (isHoliday) {
                            status = `🎈 WOLNE (${isHoliday.name})`;
                        } else if (ev) {
                            if (ev.status === 'replacement_needed') {
                                status = 'L4 / Urlop';
                            } else {
                                status = ev.raw.shift_name;
                                hours = `${ev.raw.start_time.substring(0, 5)} - ${ev.raw.end_time.substring(0, 5)}`;
                            }
                        } else if (isWeekend) {
                            status = 'Wolny Weekend';
                        }

                        return (
                            <tr key={dateStr} className={rowClass}>
                                <td className="p-3 font-medium">{format(day, 'dd.MM')}</td>
                                <td className="p-3 capitalize text-gray-600">{format(day, 'eeee', { locale: pl })}</td>
                                <td className="p-3 font-semibold">{status}</td>
                                <td className="p-3 text-gray-600">{hours}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            
            <div className="mt-16 flex justify-between text-sm text-gray-400">
                <p>Wygenerowano operacyjnie z Systemu Czasu Pracy</p>
                <p>Miejsce na podpis pracownika: ..............................</p>
            </div>
        </div>
    );
}
