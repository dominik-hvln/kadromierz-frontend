'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Printer, ImageIcon } from 'lucide-react';
import { format, getDaysInMonth } from 'date-fns';
import { pl } from 'date-fns/locale';

import { CollectiveSchedulePDFDocument } from './CollectivePdfDocument';
import { SingleUserPdfDocument } from './SingleUserPdfDocument';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
    ScheduleOverlay,
    SCHEDULE_LEGEND,
    collectScheduleUsers,
    indexOverlay,
    resolveScheduleCell,
} from '@/lib/schedule-display';

interface ExportButtonsProps {
    month: number;
    year: number;
    events: any[];
    holidays: any[];
    overlay: ScheduleOverlay;
    departmentId: string;
}

export default function ExportButtons({ month, year, events, holidays, overlay, departmentId }: ExportButtonsProps) {
    const [selectedUserForPrint, setSelectedUserForPrint] = React.useState<any>(null);

    // Wydruki pokazują tylko zaakceptowane nieobecności (bez wniosków oczekujących).
    const users = React.useMemo(() => collectScheduleUsers(events, overlay, false), [events, overlay]);
    const absenceIndex = React.useMemo(() => indexOverlay(overlay), [overlay]);

    if (!departmentId) return null;

    const exportToCSV = () => {
        const date = new Date(year, month - 1, 1);
        const count = getDaysInMonth(date);
        const daysInMonth = Array.from({ length: count }, (_, i) => new Date(year, month - 1, i + 1));
        
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        
        // Header
        const header = ["Pracownik", ...daysInMonth.map(d => format(d, 'dd.MM'))];
        csvContent += header.join(";") + "\n";

        // Rows — godziny zmian, wspólny znak nieobecności, święta wg ustawień firmy.
        users.forEach(user => {
            const row = [`${user.first_name} ${user.last_name}`];
            daysInMonth.forEach(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const cell = resolveScheduleCell({
                    event: events.find(e => e.userId === user.id && e.raw?.date === dateStr),
                    absencePending: absenceIndex.get(`${user.id}|${dateStr}`),
                    holiday: holidays.find(h => h.date === dateStr),
                    isWeekend: day.getDay() === 0 || day.getDay() === 6,
                    workOnWeekends: overlay.workOnWeekends,
                    workOnHolidays: overlay.workOnHolidays,
                    includePending: false,
                });
                row.push(cell.label || '-');
            });
            csvContent += row.join(";") + "\n";
        });

        csvContent += "\n" + [SCHEDULE_LEGEND.absence, SCHEDULE_LEGEND.replacement, ...(overlay.workOnHolidays ? [] : [SCHEDULE_LEGEND.holiday])].join(";") + "\n";
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `grafik_${year}_${month}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGeneratePDF = async () => {
        const toastId = toast.loading('Generowanie wektorowego pliku PDF...');
        try {
            // dynamic import to prevent SSR issues and window errors
            const { pdf } = await import('@react-pdf/renderer');
            const { saveAs } = (await import('file-saver')).default;
            
            const doc = <CollectiveSchedulePDFDocument month={month} year={year} events={events} holidays={holidays} overlay={overlay} />;
            const asPdf = pdf(doc);
            
            const blob = await asPdf.toBlob();
            saveAs(blob, `Zbiorczy_Grafik_${month}_${year}.pdf`);
            
            toast.success('Pobrano idealny plik PDF!', { id: toastId });
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Wystąpił błąd przy tworzeniu PDF.', { id: toastId });
        }
    };

    const handleGenerateSingleUserPDF = async () => {
        if (!selectedUserForPrint) {
            toast.error('Najpierw wybierz pracownika z listy.');
            return;
        }

        const toastId = toast.loading('Generowanie wektorowego pliku PDF...');
        try {
            // dynamic import to prevent SSR issues
            const { pdf } = await import('@react-pdf/renderer');
            // Check if file-saver is strictly required, in browser we can also use Blob directly if default export fails
            const FileSaver = await import('file-saver');
            const saveAs = FileSaver.default?.saveAs || FileSaver.saveAs;
            
            const doc = <SingleUserPdfDocument month={month} year={year} events={events} holidays={holidays} overlay={overlay} user={selectedUserForPrint} />;
            const asPdf = pdf(doc);
            
            const blob = await asPdf.toBlob();
            saveAs(blob, `Grafik_${selectedUserForPrint.first_name}_${selectedUserForPrint.last_name}_${month}_${year}.pdf`);
            
            toast.success('Pobrano idealny plik PDF!', { id: toastId });
        } catch (error) {
            console.error('Error generating Single User PDF:', error);
            toast.error('Wystąpił błąd przy tworzeniu PDF.', { id: toastId });
        }
    };

    return (
        <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" onClick={exportToCSV} className="text-gray-600">
                <Download className="w-4 h-4 mr-2" />
                CSV (Tabela)
            </Button>
            <Button variant="outline" size="sm" onClick={handleGeneratePDF} className="text-gray-600">
                <Download className="w-4 h-4 mr-2" />
                Pobierz Zbiorczy (PDF)
            </Button>
            
            <div className="flex gap-2 items-center bg-gray-50 border rounded-md p-1 px-2">
                <Select value={selectedUserForPrint?.id || ''} onValueChange={(val) => setSelectedUserForPrint(users.find(u => u.id === val))}>
                    <SelectTrigger className="w-[180px] h-8 text-xs border-0 bg-transparent shadow-none">
                        <SelectValue placeholder="Wybierz pracownika" />
                    </SelectTrigger>
                    <SelectContent>
                        {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.first_name} {u.last_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" className="h-8 px-2" disabled={!selectedUserForPrint} onClick={handleGenerateSingleUserPDF}>
                    <Download className="w-4 h-4 text-blue-600" />
                </Button>
            </div>

        </div>
    );
}
