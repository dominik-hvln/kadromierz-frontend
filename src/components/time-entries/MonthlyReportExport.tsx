'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface DailyCell {
    dayMinutes: number;
    nightMinutes: number;
    absenceMinutes: number;
    code: 'U' | 'NŻ' | 'L4' | 'I' | 'ŚW' | null;
}

interface ReportDay {
    date: string;
    day: number;
    weekday: number;
    isWeekend: boolean;
    isHoliday: boolean;
}

interface ReportRow {
    userId: string;
    firstName: string;
    lastName: string;
    cells: Record<string, DailyCell>;
    totals: {
        dayMinutes: number;
        nightMinutes: number;
        workedMinutes: number;
        absenceMinutes: number;
        holidayMinutes: number;
        totalMinutes: number;
        vacationDays: number;
        sickDays: number;
        otherAbsenceDays: number;
        holidayDays: number;
    };
}

interface MonthlyReport {
    year: number;
    month: number;
    nightStart: string;
    nightEnd: string;
    days: ReportDay[];
    rows: ReportRow[];
}

const LEGEND = 'U = urlop wypoczynkowy, NŻ = urlop na żądanie, L4 = zwolnienie lekarskie, I = inna nieobecność, ŚW = święto';

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2000, i, 1), 'LLLL', { locale: pl }),
}));

type HourFormat = 'hhmm' | 'decimal';

/** Minuty -> "8:00" (czytelne) albo "8,00" (dziesiętne, do obliczeń w Excelu). */
function formatMinutes(minutes: number, mode: HourFormat): string {
    if (!minutes) return '';
    if (mode === 'decimal') return (minutes / 60).toFixed(2).replace('.', ',');
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Kolumny podsumowań — tam zero ma być widoczne, a nie puste. */
function formatTotal(minutes: number, mode: HourFormat): string {
    return formatMinutes(minutes, mode) || (mode === 'decimal' ? '0,00' : '0:00');
}

function dayHeader(day: ReportDay, compact = false): string {
    const weekday = format(new Date(`${day.date}T12:00:00`), 'EEEEEE', { locale: pl });
    return `${String(day.day).padStart(2, '0')} ${compact ? weekday.substring(0, 2) : weekday}`;
}

/** Wartości komórki: literka nieobecności ma pierwszeństwo, inaczej godziny dzienne/nocne. */
function cellValues(cell: DailyCell | undefined, fmt: (m: number) => string): [string, string] {
    if (!cell) return ['', ''];
    if (cell.code) return [cell.code, ''];
    return [fmt(cell.dayMinutes), fmt(cell.nightMinutes)];
}

interface Props {
    userId?: string;
    userLabel?: string;
}

export function MonthlyReportExport({ userId, userLabel }: Props) {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [hourFormat, setHourFormat] = useState<HourFormat>('hhmm');
    const [busy, setBusy] = useState(false);

    const fmt = (m: number) => formatMinutes(m, hourFormat);
    const fmtTotal = (m: number) => formatTotal(m, hourFormat);
    const formatNote =
        hourFormat === 'hhmm'
            ? 'Format godzin: gg:mm (np. 8:30 = osiem i pół godziny).'
            : 'Format godzin: dziesiętny (np. 8,50 = osiem i pół godziny).';

    const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i);
    const periodLabel = format(new Date(year, month - 1, 1), 'LLLL yyyy', { locale: pl });

    const fetchReport = async (): Promise<MonthlyReport | null> => {
        const params = new URLSearchParams({ year: String(year), month: String(month) });
        if (userId && userId !== 'all') params.append('userId', userId);
        const { data } = await api.get(`/time-entries/monthly-report?${params.toString()}`);
        if (!data?.rows?.length) {
            toast.warning('Brak danych do raportu za wybrany miesiąc.');
            return null;
        }
        return data as MonthlyReport;
    };

    const fileSuffix = `${year}_${String(month).padStart(2, '0')}`;

    const handleCSV = async () => {
        setBusy(true);
        const toastId = toast.loading('Generowanie raportu CSV...');
        try {
            const report = await fetchReport();
            if (!report) {
                toast.dismiss(toastId);
                return;
            }

            const { days, rows } = report;
            const lines: string[][] = [];

            lines.push([`Ewidencja czasu pracy — ${periodLabel}`]);
            if (userLabel) lines.push([`Pracownik: ${userLabel}`]);
            lines.push([`Pora nocna: ${report.nightStart}–${report.nightEnd}`]);
            lines.push([`Legenda: ${LEGEND}`]);
            lines.push(['Dni oznaczone literką liczą się do sumy godzin tak jak dzień przepracowany.']);
            lines.push([formatNote]);
            lines.push([]);

            // Dwa wiersze nagłówka: numer dnia, pod nim podział dz./noc.
            lines.push([
                'Pracownik',
                ...days.flatMap((d) => [dayHeader(d), '']),
                'Razem godz.',
                'w tym nocne',
                'Godz. nieobecności/świąt',
                'Dni urlopu',
                'Dni L4',
            ]);
            lines.push(['', ...days.flatMap(() => ['dz.', 'noc']), '', '', '', '', '']);

            for (const row of rows) {
                lines.push([
                    `${row.lastName} ${row.firstName}`,
                    ...days.flatMap((d) => cellValues(row.cells[d.date], fmt)),
                    fmtTotal(row.totals.totalMinutes),
                    fmtTotal(row.totals.nightMinutes),
                    fmtTotal(row.totals.absenceMinutes + row.totals.holidayMinutes),
                    String(row.totals.vacationDays),
                    String(row.totals.sickDays),
                ]);
            }

            const csv = lines
                .map((cols) => cols.map((c) => (c.includes(';') ? `"${c}"` : c)).join(';'))
                .join('\n');

            const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `ewidencja_${fileSuffix}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);

            toast.success('Pobrano raport CSV', { id: toastId });
        } catch (error) {
            console.error('Błąd generowania CSV:', error);
            toast.error('Nie udało się wygenerować raportu CSV', { id: toastId });
        } finally {
            setBusy(false);
        }
    };

    const handlePDF = async () => {
        setBusy(true);
        const toastId = toast.loading('Generowanie raportu PDF...');
        try {
            const report = await fetchReport();
            if (!report) {
                toast.dismiss(toastId);
                return;
            }

            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable'),
            ]);

            const doc = new jsPDF({ orientation: 'landscape' });

            // Czcionka z polskimi znakami (jsPDF domyślnie ich nie ma).
            const fontResponse = await fetch('/fonts/Roboto-Regular.ttf');
            if (!fontResponse.ok) throw new Error('Nie udało się załadować czcionki');
            const buffer = await fontResponse.arrayBuffer();
            let binary = '';
            const bytes = new Uint8Array(buffer);
            for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
            doc.addFileToVFS('Roboto-Regular.ttf', btoa(binary));
            doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
            doc.setFont('Roboto');

            const { days, rows } = report;
            const half = Math.ceil(days.length / 2);
            const chunks = [days.slice(0, half), days.slice(half)];

            const drawHeader = (subtitle: string) => {
                doc.setFontSize(13);
                doc.text(`Ewidencja czasu pracy — ${periodLabel}`, 14, 14);
                doc.setFontSize(8);
                doc.text(
                    `${subtitle}${userLabel ? ` | Pracownik: ${userLabel}` : ''} | Pora nocna: ${report.nightStart}–${report.nightEnd}`,
                    14,
                    20,
                );
                doc.text(`Legenda: ${LEGEND}`, 14, 24);
                doc.text(formatNote, 14, 28);
            };

            // Roboto zarejestrowaliśmy tylko w odmianie normalnej — bez tego autoTable
            // rysuje nagłówki pogrubione, spada na Helveticę i gubi polskie znaki (ś -> [).
            const headStyles = {
                font: 'Roboto',
                fontStyle: 'normal' as const,
                fillColor: [51, 65, 85] as [number, number, number],
            };

            chunks.forEach((chunk, index) => {
                if (index > 0) doc.addPage();
                drawHeader(`Dni ${chunk[0].day}–${chunk[chunk.length - 1].day}`);

                autoTable(doc, {
                    startY: 33,
                    head: [
                        // Etykieta dnia scalona nad parą kolumn dz./noc.
                        ['Pracownik', ...chunk.map((d) => ({ content: dayHeader(d, true), colSpan: 2 }))],
                        ['', ...chunk.flatMap(() => ['dz.', 'noc'])],
                    ],
                    body: rows.map((row) => [
                        `${row.lastName} ${row.firstName}`,
                        ...chunk.flatMap((d) => cellValues(row.cells[d.date], fmt)),
                    ]),
                    styles: { font: 'Roboto', fontSize: 6.5, cellPadding: 1, halign: 'center' },
                    headStyles: { ...headStyles, fontSize: 6 },
                    columnStyles: { 0: { cellWidth: 30, halign: 'left' } },
                    // Weekendy i święta na szaro, żeby od razu było widać dni wolne.
                    didParseCell: (data) => {
                        if (data.column.index === 0) return;
                        const day = chunk[Math.floor((data.column.index - 1) / 2)];
                        if (day && (day.isWeekend || day.isHoliday)) {
                            data.cell.styles.fillColor =
                                data.section === 'head' ? [71, 85, 105] : [241, 245, 249];
                        }
                    },
                });
            });

            // Strona z podsumowaniem — w tym wyliczenie godzin nocnych.
            doc.addPage();
            drawHeader('Podsumowanie miesiąca');
            autoTable(doc, {
                startY: 33,
                head: [[
                    'Pracownik',
                    'Razem godz.',
                    'w tym dzienne',
                    'w tym nocne',
                    'Godz. nieobecności/świąt',
                    'Dni urlopu',
                    'Dni L4',
                    'Dni innych nieob.',
                    'Dni świąt',
                ]],
                body: rows.map((row) => [
                    `${row.lastName} ${row.firstName}`,
                    fmtTotal(row.totals.totalMinutes),
                    fmtTotal(row.totals.dayMinutes),
                    fmtTotal(row.totals.nightMinutes),
                    fmtTotal(row.totals.absenceMinutes + row.totals.holidayMinutes),
                    String(row.totals.vacationDays),
                    String(row.totals.sickDays),
                    String(row.totals.otherAbsenceDays),
                    String(row.totals.holidayDays),
                ]),
                styles: { font: 'Roboto', fontSize: 8, cellPadding: 2, halign: 'right' },
                headStyles: { ...headStyles, fontSize: 8, halign: 'center' },
                columnStyles: { 0: { halign: 'left' } },
            });

            doc.save(`ewidencja_${fileSuffix}.pdf`);
            toast.success('Pobrano raport PDF', { id: toastId });
        } catch (error) {
            console.error('Błąd generowania PDF:', error);
            toast.error('Nie udało się wygenerować raportu PDF', { id: toastId });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
            <span className="text-sm font-medium">Raport miesięczny</span>

            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                    {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)} className="capitalize">
                            {m.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="h-9 w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                    {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={hourFormat} onValueChange={(v) => setHourFormat(v as HourFormat)}>
                <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="hhmm">Godziny gg:mm</SelectItem>
                    <SelectItem value="decimal">Godziny dziesiętne</SelectItem>
                </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleCSV} disabled={busy}>
                <FileDown className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePDF} disabled={busy}>
                <FileDown className="mr-2 h-4 w-4" /> PDF
            </Button>

            <span className="text-xs text-muted-foreground">
                Godziny dzienne i nocne osobno, nieobecności literką — wszystko liczy się do sumy miesiąca.
                {hourFormat === 'hhmm'
                    ? ' W Excelu ustaw kolumnom sum format [g]:mm, jeśli suma przekracza 24h.'
                    : ' Format dziesiętny sumuje się w Excelu bez dodatkowych ustawień.'}
            </span>
        </div>
    );
}
