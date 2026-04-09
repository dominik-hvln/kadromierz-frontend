'use client';

import React, { useMemo } from 'react';
import { getDaysInMonth, format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface CollectiveSchedulePrintProps {
    month: number;
    year: number;
    events: any[];
    holidays: any[];
}

export default function CollectiveSchedulePrint({ month, year, events, holidays }: CollectiveSchedulePrintProps) {
    const daysInMonth = useMemo(() => {
        const date = new Date(year, month - 1, 1);
        const count = getDaysInMonth(date);
        return Array.from({ length: count }, (_, i) => new Date(year, month - 1, i + 1));
    }, [month, year]);

    const users = useMemo(() => {
        const usersMap = new Map();
        events.forEach(e => {
            if (!usersMap.has(e.userId) && e.raw?.users) {
                usersMap.set(e.userId, e.raw.users);
            }
        });
        return Array.from(usersMap.values()).sort((a, b) => a.last_name.localeCompare(b.last_name));
    }, [events]);

    const renderShiftBadge = (shiftName: string) => {
        const name = shiftName.toLowerCase();
        if (name.includes('rano')) {
            return <div className="text-[9px] font-bold text-sky-700 bg-sky-100 rounded-full py-[2px] px-1 text-center w-full">Rano</div>;
        }
        if (name.includes('pop')) {
            return <div className="text-[9px] font-bold text-indigo-700 bg-indigo-100 rounded-full py-[2px] px-1 text-center w-full">Popo.</div>;
        }
        if (name.includes('noc')) {
            return <div className="text-[9px] font-bold text-slate-700 bg-slate-200 rounded-full py-[2px] px-1 text-center w-full">Noc</div>;
        }
        return <div className="text-[9px] font-bold text-gray-700 bg-gray-100 rounded-full py-[2px] px-1 text-center w-full">{shiftName.substring(0, 4)}</div>;
    };

    return (
        <div id="printable-collective-schedule" className="bg-white p-6 absolute -left-[9999px] top-0 w-[1400px]">
            {/* Nagłówek eleganckiego grafiku zbiorczego */}
            <div className="flex justify-between items-end border-b-2 border-gray-900 pb-4 mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Zbiorczy Grafik Pracy</h1>
                    <p className="text-xl text-gray-500 font-medium mt-1">Okres: <span className="text-blue-600 font-bold">{format(new Date(year, month - 1, 1), 'LLLL yyyy', { locale: pl }).toUpperCase()}</span></p>
                </div>
                <div className="text-right text-sm text-gray-400">
                    <p>Wygenerowano: {format(new Date(), 'dd.MM.yyyy HH:mm')}</p>
                    <p className="font-semibold text-gray-500 mt-1">System Effixy</p>
                </div>
            </div>

            {/* Nowoczesna Tabela bez "pasków" (zebra) */}
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider w-40 border-r border-gray-200">Pracownik</th>
                            {daysInMonth.map(day => {
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                return (
                                    <th key={day.toISOString()} className={`p-2 text-center text-[10px] font-bold uppercase ${isWeekend ? 'bg-red-50 text-red-600' : 'text-gray-500'} border-r border-gray-200`}>
                                        <div className="flex flex-col items-center">
                                            <span>{format(day, 'dd')}</span>
                                            <span className="text-[8px] font-medium mt-[1px] opacity-70">{format(day, 'eee', { locale: pl }).substring(0, 2)}</span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-3 text-sm font-semibold text-gray-800 border-r border-gray-100 truncate">
                                    {user.first_name} {user.last_name}
                                </td>
                                {daysInMonth.map(day => {
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                    const isHoliday = holidays.find(h => h.date === dateStr);
                                    const ev = events.find(e => e.userId === user.id && e.raw?.date === dateStr);

                                    let bgClass = isWeekend ? 'bg-red-50/30' : 'bg-transparent';
                                    if (isHoliday) bgClass = 'bg-amber-50/50';

                                    return (
                                        <td key={dateStr} className={`p-1 border-r border-gray-100 align-middle ${bgClass}`}>
                                            <div className="w-full flex items-center justify-center h-8">
                                                {isHoliday ? (
                                                    <span className="text-[10px] font-bold text-amber-600">W</span>
                                                ) : ev ? (
                                                    ev.status === 'replacement_needed' 
                                                        ? <div className="text-[9px] font-bold text-red-700 bg-red-100 rounded-full py-[2px] px-1 w-full text-center">L4/Urlop</div>
                                                        : renderShiftBadge(ev.raw.shift_name)
                                                ) : (
                                                    <span className="text-gray-300 text-[10px]">-</span>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Opisy / Legenda pod tabelą */}
            <div className="mt-8 flex gap-6 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sky-100 rounded-full"></div> Rano</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-100 rounded-full"></div> Popołudnie</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-50 border border-amber-200 rounded"></div> Dzień Wolny / Święto</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div> Weekend</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-100 rounded-full"></div> Urlop/L4</div>
            </div>
        </div>
    );
}
