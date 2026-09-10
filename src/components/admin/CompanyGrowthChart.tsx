'use client';

import { useMemo, useState } from 'react';

interface GrowthPoint {
    month: string; // 'YYYY-MM'
    count: number;
    cumulative: number;
}

const MONTH_SHORT = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

function monthLabel(month: string) {
    const [year, m] = month.split('-');
    return { short: MONTH_SHORT[Number(m) - 1], year };
}

function firmy(n: number) {
    if (n === 1) return 'firma';
    const last = n % 10;
    const lastTwo = n % 100;
    if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return 'firmy';
    return 'firm';
}

/**
 * Nowe firmy w kolejnych miesiącach. Jedna seria, więc bez legendy —
 * tytuł nazywa dane. Rysowane bezpośrednio w HTML/CSS: projekt nie ma
 * biblioteki wykresów, a dokładanie jej dla jednego kafelka to przesada.
 */
export default function CompanyGrowthChart({ data }: { data: GrowthPoint[] }) {
    const [hovered, setHovered] = useState<number | null>(null);

    const max = useMemo(() => Math.max(1, ...data.map((d) => d.count)), [data]);
    const total = useMemo(() => data.reduce((acc, d) => acc + d.count, 0), [data]);

    // Siatka odniesienia: 0 / połowa / maksimum
    const gridValues = useMemo(() => {
        const half = Math.round(max / 2);
        return [...new Set([0, half, max])].sort((a, b) => a - b);
    }, [max]);

    if (data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64 flex items-center justify-center text-gray-400">
                Brak danych o przyroście firm.
            </div>
        );
    }

    const plotHeight = 150;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-baseline justify-between mb-1">
                <h2 className="text-sm font-medium text-gray-500">Nowe firmy w miesiącu</h2>
                <span className="text-xs text-gray-400">
                    {total} w ciągu {data.length} mies.
                </span>
            </div>

            <div className="relative pt-4">
                {/* Siatka — celowo wycofana wizualnie */}
                <div className="absolute inset-x-0 top-4 pointer-events-none" style={{ height: plotHeight }}>
                    {gridValues.map((v) => (
                        <div
                            key={v}
                            className="absolute inset-x-0 border-t border-gray-100"
                            style={{ bottom: `${(v / max) * 100}%` }}
                        >
                            {v > 0 && (
                                <span className="absolute -top-2 -left-1 text-[10px] text-gray-300 bg-white pr-1">{v}</span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="relative flex items-end gap-[2px]" style={{ height: plotHeight }}>
                    {data.map((point, i) => {
                        const heightPct = point.count === 0 ? 0 : Math.max(4, (point.count / max) * 100);
                        const isHovered = hovered === i;
                        const { short, year } = monthLabel(point.month);
                        return (
                            <div
                                key={point.month}
                                className="relative flex-1 h-full flex items-end"
                                onMouseEnter={() => setHovered(i)}
                                onMouseLeave={() => setHovered(null)}
                            >
                                {point.count === 0 ? (
                                    <div className="w-full h-[2px] bg-gray-200 rounded-full" />
                                ) : (
                                    <div
                                        className="w-full rounded-t"
                                        style={{
                                            height: `${heightPct}%`,
                                            backgroundColor: isHovered ? '#4338ca' : '#4f46e5',
                                        }}
                                    />
                                )}

                                {isHovered && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white shadow-lg">
                                        <span className="text-gray-300">{short} {year} · </span>
                                        {point.count} {firmy(point.count)}
                                        <span className="text-gray-400"> · łącznie {point.cumulative}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-[2px] mt-2">
                    {data.map((point, i) => {
                        const { short, year } = monthLabel(point.month);
                        // Etykietujemy wybiórczo — styczeń oraz skrajne miesiące
                        const isJanuary = point.month.endsWith('-01');
                        const show = isJanuary || i === 0 || i === data.length - 1;
                        return (
                            <div key={point.month} className="flex-1 text-center">
                                {show && (
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                        {short}
                                        {isJanuary ? ` ${year.slice(2)}` : ''}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
