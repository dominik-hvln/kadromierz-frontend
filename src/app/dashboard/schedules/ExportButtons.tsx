'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Printer } from 'lucide-react';
import { format, getDaysInMonth } from 'date-fns';
import { pl } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UrbanistRegular } from '@/lib/fonts/Urbanist-Regular-normal';

import SingleUserPrint from './SingleUserPrint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

    const handlePrintPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
        doc.addFileToVFS("Urbanist.ttf", UrbanistRegular);
        doc.addFont("Urbanist.ttf", "Urbanist", "normal");
        doc.setFont("Urbanist", "normal");
        
        const date = new Date(year, month - 1, 1);
        const count = getDaysInMonth(date);
        const daysInMonth = Array.from({ length: count }, (_, i) => new Date(year, month - 1, i + 1));
        const header = ["Pracownik", ...daysInMonth.map(d => format(d, 'dd'))];

        const body: any[] = [];
        users.forEach(user => {
            const row = [`${user.first_name} ${user.last_name}`];
            daysInMonth.forEach(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isHoliday = holidays.find(h => h.date === dateStr);
                const ev = events.find(e => e.userId === user.id && e.raw?.date === dateStr);
                
                if (isHoliday) row.push('W');
                else if (ev) {
                    if (ev.status === 'replacement_needed') row.push('L4');
                    else row.push(ev.raw.shift_name.substring(0, 3));
                } else row.push('-');
            });
            body.push(row);
        });

        const title = `Grafik Pracy: ${month}/${year}`;
        doc.setFontSize(14);
        doc.text(title, 14, 15);

        autoTable(doc, {
            head: [header],
            body: body,
            startY: 20,
            styles: { font: 'Urbanist', fontSize: 6, cellPadding: 1, overflow: 'linebreak' },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        });

        doc.save(`grafik_${year}_${month}.pdf`);
    };

    const handlePrintSingleUser = () => {
        if (!selectedUserForPrint) return;
        const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });

        doc.addFileToVFS("Urbanist.ttf", UrbanistRegular);
        doc.addFont("Urbanist.ttf", "Urbanist", "normal");
        doc.setFont("Urbanist", "normal");

        doc.setFontSize(16);
        doc.text('Miesięczny Grafik Pracy', 14, 15);
        doc.setFontSize(12);
        const enTitle = `${selectedUserForPrint.first_name} ${selectedUserForPrint.last_name}`;
        doc.text(enTitle, 14, 23);
        doc.text(`Okres: ${month}/${year}`, 14, 30);

        const date = new Date(year, month - 1, 1);
        const count = getDaysInMonth(date);
        const daysInMonth = Array.from({ length: count }, (_, i) => new Date(year, month - 1, i + 1));
        
        const head = [["Data", "Dzień", "Status / Zmiana", "Godziny"]];
        const body: any[] = [];

        daysInMonth.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isHoliday = holidays.find(h => h.date === dateStr);
            const ev = events.find(e => e.userId === selectedUserForPrint.id && e.raw?.date === dateStr);

            let status = '-';
            let hours = '-';

            if (isHoliday) {
                status = `WOLNE (${isHoliday.name || ''})`;
            } else if (ev) {
                if (ev.status === 'replacement_needed') {
                    status = 'L4 / Urlop';
                } else {
                    status = ev.raw.shift_name;
                    hours = `${ev.raw.start_time.substring(0, 5)} - ${ev.raw.end_time.substring(0, 5)}`;
                }
            } else if (isWeekend) {
                status = 'Weekend';
            }

            body.push([
                format(day, 'dd.MM'),
                format(day, 'eeee', { locale: pl }),
                status,
                hours
            ]);
        });

        autoTable(doc, {
            head: head,
            body: body,
            startY: 38,
            styles: { font: 'Urbanist', fontSize: 10 },
            didParseCell: function (hookData: any) {
                 const rowIdx = hookData.row.index;
                 if (rowIdx >= 0 && hookData.section === 'body') {
                      const d = daysInMonth[rowIdx];
                      const dStr = format(d, 'yyyy-MM-dd');
                      if (d.getDay() === 0 || d.getDay() === 6) {
                          hookData.cell.styles.fillColor = [254, 242, 242]; 
                          hookData.cell.styles.textColor = [220, 38, 38];
                      }
                      if (holidays.find(h => h.date === dStr)) {
                          hookData.cell.styles.fillColor = [254, 243, 199]; 
                          hookData.cell.styles.textColor = [217, 119, 6];
                      }
                 }
            }
        });

        doc.text('Podpis pracownika: ..............................', 14, (doc as any).lastAutoTable.finalY + 20);

        doc.save(`grafik_${selectedUserForPrint.first_name}_${selectedUserForPrint.last_name}_${year}_${month}.pdf`);
    };

    return (
        <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" onClick={exportToCSV} className="text-gray-600">
                <Download className="w-4 h-4 mr-2" />
                CSV (Tabela)
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintPDF} className="text-gray-600">
                <Printer className="w-4 h-4 mr-2" />
                Drukuj PDF (Tabela)
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
        </div>
    );
}
