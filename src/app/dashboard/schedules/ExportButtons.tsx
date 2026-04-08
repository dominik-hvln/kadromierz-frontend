'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Printer, ImageIcon } from 'lucide-react';
import { format, getDaysInMonth } from 'date-fns';
import { pl } from 'date-fns/locale';

import SingleUserPrint from './SingleUserPrint';
import CollectiveSchedulePrint from './CollectiveSchedulePrint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ExportButtonsProps {
    month: number;
    year: number;
    events: any[];
    holidays: any[];
    departmentId: string;
}

export default function ExportButtons({ month, year, events, holidays, departmentId }: ExportButtonsProps) {
    const [selectedUserForPrint, setSelectedUserForPrint] = React.useState<any>(null);

    // users extracted from events
    const users = React.useMemo(() => {
        const usersMap = new Map();
        events.forEach(e => {
            if (!usersMap.has(e.userId) && e.raw?.users) {
                usersMap.set(e.userId, e.raw.users);
            }
        });
        return Array.from(usersMap.values()).sort((a, b) => a.last_name.localeCompare(b.last_name));
    }, [events]);

    if (!departmentId) return null;

    const exportToCSV = () => {
        const date = new Date(year, month - 1, 1);
        const count = getDaysInMonth(date);
        const daysInMonth = Array.from({ length: count }, (_, i) => new Date(year, month - 1, i + 1));
        
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        
        // Header
        const header = ["Pracownik", ...daysInMonth.map(d => format(d, 'dd.MM'))];
        csvContent += header.join(";") + "\n";
        
        // Rows
        users.forEach(user => {
            const row = [`${user.first_name} ${user.last_name}`];
            daysInMonth.forEach(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isHoliday = holidays.find(h => h.date === dateStr);
                const ev = events.find(e => e.userId === user.id && e.raw?.date === dateStr);
                
                if (isHoliday) row.push('WOLNE');
                else if (ev) {
                    if (ev.status === 'replacement_needed') row.push('L4/URL');
                    else row.push(ev.raw.shift_name);
                } else row.push('-');
            });
            csvContent += row.join(";") + "\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `grafik_${year}_${month}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintPDF = async () => {
        const element = document.getElementById('printable-collective-schedule');
        if (!element) return;
        
        const toastId = toast.loading('Generowanie wysokiej jakości PDF...');
        
        try {
            // dynamic import to prevent SSR issues
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).jsPDF;
            
            const canvas = await html2canvas(element, {
                scale: 2, // Wyższa rozdzielczość "Retina"
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            // Landscape A4
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            // Add slight margin (5mm offset) or just fit width
            pdf.addImage(imgData, 'PNG', 0, 5, pdfWidth, pdfHeight);
            pdf.save(`Zbiorczy_Grafik_${month}_${year}.pdf`);
            
            toast.success('Pomyślnie zapisano PDF!', { id: toastId });
        } catch (error) {
            console.error('Error generating PDF', error);
            toast.error('Wystąpił błąd podczas generowania pliku PDF.', { id: toastId });
        }
    };

    const handlePrintSingleUser = () => {
        if (!selectedUserForPrint) return;
        document.body.classList.add('print-single-user-mode');
        setTimeout(() => {
            window.print();
            document.body.classList.remove('print-single-user-mode');
        }, 100);
    };

    return (
        <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" onClick={exportToCSV} className="text-gray-600">
                <Download className="w-4 h-4 mr-2" />
                CSV (Tabela)
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintPDF} className="text-gray-600">
                <Printer className="w-4 h-4 mr-2" />
                Zbiorczy Grafik (PDF Image)
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
                <Button size="sm" variant="ghost" className="h-8 px-2" disabled={!selectedUserForPrint} onClick={handlePrintSingleUser}>
                    <Printer className="w-4 h-4 text-blue-600" />
                </Button>
            </div>

            <SingleUserPrint 
                month={month}
                year={year}
                events={events}
                holidays={holidays}
                user={selectedUserForPrint}
            />

            <div className="absolute overflow-hidden h-0 w-0">
                <CollectiveSchedulePrint 
                    month={month}
                    year={year}
                    events={events}
                    holidays={holidays}
                />
            </div>
        </div>
    );
}
