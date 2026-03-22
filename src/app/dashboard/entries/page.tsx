'use client';

import {useEffect, useState, useCallback, useMemo} from 'react'; // Dodaj useCallback
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, differenceInMinutes, isValid } from 'date-fns';
import { Calendar as CalendarIcon, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditEntryForm } from '@/components/time-entries/EditEntryForm';
import { AxiosError } from 'axios';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Poprawiony import Label
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, DollarSign, Clock, Target } from 'lucide-react';

interface FTE {
    id: string;
    name: string;
    multiplier: number;
}

interface TimeEntry {
    id: string;
    start_time: string;
    end_time: string | null;
    user: { first_name: string; last_name: string };
    project: { name: string };
    task: { name: string };
    was_edited: boolean;
    is_outside_geofence: boolean;
}
interface User { 
    id: string; 
    first_name: string; 
    last_name: string; 
    fte_id?: string;
    hourly_rate?: number;
}
interface AuditLog {
    id: number;
    editor: { first_name: string | null; last_name: string | null };
    created_at: string;
    change_reason: string | null;
}

export default function TimeEntriesPage() {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [date, setDate] = useState<DateRange | undefined>();
    const [selectedUserId, setSelectedUserId] = useState<string>('all');
    const [entryToEdit, setEntryToEdit] = useState<TimeEntry | null>(null);
    const [entryToDelete, setEntryToDelete] = useState<TimeEntry | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [ftes, setFtes] = useState<FTE[]>([]);
    const { user } = useAuthStore();
    const isEmployee = user?.role === 'employee';

    const totalDurationMinutes = useMemo(() => {
        return entries.reduce((total, entry) => {
            if (entry.end_time) {
                const start = new Date(entry.start_time);
                const end = new Date(entry.end_time);
                if (isValid(start) && isValid(end)) {
                    const diff = differenceInMinutes(end, start);
                    return total + (diff > 0 ? diff : 0);
                }
            }
            return total;
        }, 0);
    }, [entries]);

    const totalHours = Math.floor(totalDurationMinutes / 60);
    const totalMinutes = totalDurationMinutes % 60;

    const handleExportCSV = () => {
        const headers = "Pracownik;Projekt;Zlecenie;Data Rozpoczęcia;Czas Rozpoczęcia;Data Zakończenia;Czas Zakończenia;Czas Trwania (min)\n";

        const rows = entries.map(entry => {
            const start = new Date(entry.start_time);
            const end = entry.end_time ? new Date(entry.end_time) : null;
            const durationMin = end ? differenceInMinutes(end, start) : 0;

            return [
                `"${entry.user.first_name} ${entry.user.last_name}"`,
                `"${entry.project?.name || '-'}"`,
                `"${entry.task?.name || 'Ogólny'}"`,
                start.toLocaleDateString('pl-PL'),
                start.toLocaleTimeString('pl-PL'),
                end ? end.toLocaleDateString('pl-PL') : '-',
                end ? end.toLocaleTimeString('pl-PL') : '-',
                durationMin
            ].join(';');
        }).join('\n');

        const csvContent = headers + rows;
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // \uFEFF dla poprawnego kodowania polskich znaków w Excelu
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'raport_czasu_pracy.csv';
        link.click();
    };

    const handleExportPDF = async () => {
        // 1. Funkcja musi być teraz asynchroniczna
        const doc = new jsPDF();

        try {
            // 2. Pobierz plik czcionki z folderu /public
            const fontResponse = await fetch('/fonts/Roboto-Regular.ttf');
            if (!fontResponse.ok) {
                throw new Error('Nie udało się załadować czcionki');
            }
            const fontBlob = await fontResponse.blob();

            // 3. Przeczytaj czcionkę jako Base64
            const reader = new FileReader();
            reader.readAsDataURL(fontBlob);

            // Używamy Promise, aby poczekać na wczytanie pliku
            await new Promise<void>((resolve) => {
                reader.onloadend = () => {
                    // Otrzymujemy string base64
                    const fontBase64 = (reader.result as string).split(',')[1];

                    // 4. Zarejestruj czcionkę w jsPDF
                    doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
                    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
                    doc.setFont('Roboto'); // Ustaw ją jako domyślną

                    resolve();
                };
            });

            // 5. Cała reszta logiki generowania PDF (teraz z poprawną czcionką)
            doc.text("Raport Ewidencji Czasu Pracy", 14, 20);
            doc.setFontSize(10);
            doc.text(`Filtry: ${date?.from ? format(date.from, 'dd.MM.yyyy') : ''} - ${date?.to ? format(date.to, 'dd.MM.yyyy') : ''}`, 14, 25);

            const tableColumn = ["Pracownik", "Projekt / Zlecenie", "Start", "Koniec", "Czas Trwania"];
            const tableRows: (string | number)[][] = [];

            entries.forEach(entry => {
                const row = [
                    `${entry.user.first_name} ${entry.user.last_name}`,
                    `${entry.project?.name || '-'} / ${entry.task?.name || 'Ogólny'}`,
                    new Date(entry.start_time).toLocaleString('pl-PL'),
                    entry.end_time ? new Date(entry.end_time).toLocaleString('pl-PL') : '-',
                    formatDuration(entry.start_time, entry.end_time)
                ];
                tableRows.push(row);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 35,
                styles: {
                    font: 'Roboto', // Używamy naszej nowej czcionki
                },
            });

            const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
            doc.setFont('Roboto');
            doc.setFontSize(12);

            // Ta linia teraz zadziała poprawnie
            doc.text(`Łączny czas pracy: ${totalHours}h ${totalMinutes}m`, 14, finalY + 10);

            doc.save('raport_czasu_pracy.pdf');

        } catch (error) {
            console.error("Błąd podczas generowania PDF:", error);
            toast.error('Błąd', { description: 'Nie udało się wygenerować PDF. Sprawdź, czy plik czcionki jest dostępny.' });
        }
    };

    const fetchTimeEntries = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (date?.from) params.append('dateFrom', date.from.toISOString());
            if (date?.to) params.append('dateTo', date.to.toISOString());
            if (selectedUserId && selectedUserId !== 'all') {
                params.append('userId', selectedUserId);
            }

            const response = await api.get(`/time-entries?${params.toString()}`);
            setEntries(response.data);
        } catch (error: unknown) {
            console.error('Błąd fetchTimeEntries:', error);
            const errorMessage = error instanceof Error ? error.message : 'Nie udało się pobrać ewidencji.';
            toast.error('Błąd', { description: errorMessage as string });
        } finally {
            setIsLoading(false);
        }
    }, [date, selectedUserId]);

    const fetchUsersAndFtes = useCallback(async () => {
        if (isEmployee) return;

        try {
            const [usersRes, ftesRes] = await Promise.all([
                api.get('/users'),
                api.get('/company-settings/ftes')
            ]);
            setUsers(usersRes.data);
            setFtes(ftesRes.data);
        } catch (error: unknown) {
            console.error('Błąd podczas pobierania danych:', error instanceof Error ? error.message : error);
        }
    }, [isEmployee]);

    useEffect(() => {
        fetchUsersAndFtes();
        fetchTimeEntries();
    }, [fetchUsersAndFtes, fetchTimeEntries]);

    const formatDuration = (start: string, end: string | null) => {
        if (!end) return 'W trakcie';
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (!isValid(startDate) || !isValid(endDate)) return 'N/A';
        const minutes = differenceInMinutes(endDate, startDate);
        if (minutes < 0) return 'Błąd';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    const getWorkingDays = (startDate: Date, endDate: Date) => {
        let count = 0;
        const curDate = new Date(startDate.getTime());
        curDate.setHours(0, 0, 0, 0);
        const end = new Date(endDate.getTime());
        end.setHours(23, 59, 59, 999);
        
        while (curDate <= end) {
            const dayOfWeek = curDate.getDay();
            if(dayOfWeek !== 0 && dayOfWeek !== 6) count++;
            curDate.setDate(curDate.getDate() + 1);
        }
        return count;
    };

    const selectedUserObj = users.find(u => u.id === selectedUserId);
    const selectedFte = selectedUserObj?.fte_id ? ftes.find(f => f.id === selectedUserObj.fte_id) : null;
    
    let expectedHours = 0;
    if (selectedFte && date?.from && date?.to) {
        const workingDays = getWorkingDays(date.from, date.to);
        expectedHours = workingDays * 8 * selectedFte.multiplier;
    }

    const overtimeHours = totalDurationMinutes / 60 - expectedHours;
    const overtimeMinutes = Math.abs(totalDurationMinutes % 60);
    const expectedHoursWhole = Math.floor(expectedHours);
    const expectedMinutes = Math.round((expectedHours - expectedHoursWhole) * 60);

    const handleDelete = async () => {
        if (!entryToDelete) return;
        try {
            await api.delete(`/time-entries/${entryToDelete.id}`, {
                data: { reason: deleteReason }
            });
            toast.success('Sukces!', { description: 'Wpis został usunięty.' });
            fetchTimeEntries();
        } catch (error: unknown) { // ✅ POPRAWIONY TYP
            console.error("Błąd handleDelete:", error); // Dodaj log dla diagnostyki
            const axiosError = error as AxiosError;
            // Sprawdź, czy error jest obiektem AxiosError i ma odpowiedź
            const errorMessage = axiosError.response?.data
                ? (axiosError.response.data as { message: string })?.message
                : (error instanceof Error ? error.message : 'Nie udało się usunąć wpisu.'); // Ogólny fallback

            toast.error('Błąd', { description: errorMessage });
        } finally {
            setEntryToDelete(null);
            setDeleteReason('');
        }
    };

    const handleUpdateSuccess = () => {
        setEntryToEdit(null);
        fetchTimeEntries();
    };

    const handleShowHistory = async (entryId: string) => {
        try {
            const response = await api.get(`/time-entries/${entryId}/audit-logs`);
            setAuditLogs(response.data);
            setIsHistoryOpen(true);
        } catch (error: unknown) { // ✅ POPRAWIONY TYP
            console.error("Błąd handleShowHistory:", error); // Dodaj log
            // ✅ DODANE SPRAWDZENIE INSTANCEOF ERROR
            const errorMessage = error instanceof Error ? error.message : 'Nie udało się pobrać historii zmian.';
            toast.error('Błąd', { description: errorMessage });
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Ewidencja Czasu Pracy</h1>

            <div className="flex flex-wrap items-center gap-4 mb-4 p-4 border rounded-lg bg-card">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-[280px] justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to ? `${format(date.from, 'dd.MM.yyyy')} - ${format(date.to, 'dd.MM.yyyy')}` : format(date.from, 'dd.MM.yyyy')) : <span>Wybierz zakres dat</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} /></PopoverContent>
                </Popover>

                {!isEmployee && (
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="w-full sm:w-[280px]"><SelectValue placeholder="Filtruj po pracowniku" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Wszyscy pracownicy</SelectItem>
                            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.first_name} {u.last_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}

                <Button onClick={fetchTimeEntries}>Filtruj</Button>
                <div className="flex gap-2 ml-auto">
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <FileDown className="mr-2 h-4 w-4" /> CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF}>
                        <FileDown className="mr-2 h-4 w-4" /> PDF
                    </Button>
                </div>
            </div>
            <div className="mb-4 bg-gray-50 p-6 rounded-xl border pb-6">
                <h3 className="text-lg font-semibold mb-4">
                    Podsumowanie dla wybranych filtrów
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Wypracowany czas</p>
                            <p className="text-2xl font-bold text-gray-900">{totalHours}h {totalMinutes}m</p>
                        </div>
                    </div>

                    {selectedUserObj && (
                        <>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-start space-x-3">
                                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                    <Target className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Oczekiwany czas</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {date?.from && date?.to && selectedFte ? `${expectedHoursWhole}h ${expectedMinutes}m` : 'Brak danych daty/etatu'}
                                    </p>
                                    {selectedFte && <p className="text-xs text-gray-500 mt-1">Wymiar: {selectedFte.name}</p>}
                                </div>
                            </div>

                            {date?.from && date?.to && selectedFte && (
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-start space-x-3">
                                    <div className={`p-2 rounded-lg ${overtimeHours >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Bilans czasu</p>
                                        <p className={`text-2xl font-bold ${overtimeHours >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {overtimeHours > 0 ? '+' : (overtimeHours < 0 ? '-' : '')}
                                            {Math.floor(Math.abs(overtimeHours))}h {overtimeMinutes}m
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {overtimeHours >= 0 ? 'Nadgodziny' : 'Niedoczas'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedUserObj.hourly_rate && (
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-start space-x-3">
                                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Estymowane wynagrodzenie</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {((totalDurationMinutes / 60) * Number(selectedUserObj.hourly_rate)).toFixed(2)} PLN
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Stawka: {selectedUserObj.hourly_rate} PLN/h</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pracownik</TableHead>
                            <TableHead>Projekt / Zlecenie</TableHead>
                            <TableHead>Start</TableHead>
                            <TableHead>Koniec</TableHead>
                            <TableHead>Czas trwania</TableHead>
                            {!isEmployee && <TableHead className="text-right">Akcje</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center">Ładowanie...</TableCell></TableRow>
                        ) : (
                            entries.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-1"> {/* Zmniejszony odstęp */}
                                            <span>{entry.user.first_name} {entry.user.last_name}</span>
                                            {entry.was_edited && <Badge variant="outline" className="ml-1 px-1 text-xs">Edyt.</Badge>} {/* Zmniejszony badge */}
                                            {entry.is_outside_geofence && (
                                                <TooltipProvider delayDuration={100}>
                                                    <Tooltip>
                                                        <TooltipTrigger className="ml-1">
                                                            <AlertTriangle className="h-4 w-4 text-destructive" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Wpis zarejestrowany poza strefą</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{entry.project?.name || '-'} / {entry.task?.name || 'Ogólny'}</TableCell> {/* Zabezpieczenie przed null */}
                                    <TableCell>{new Date(entry.start_time).toLocaleString('pl-PL')}</TableCell>
                                    <TableCell>{entry.end_time ? new Date(entry.end_time).toLocaleString('pl-PL') : '-'}</TableCell>
                                    <TableCell className="font-medium">{formatDuration(entry.start_time, entry.end_time)}</TableCell>
                                    {!isEmployee && (
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Otwórz menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setEntryToEdit(entry)}>Edytuj</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleShowHistory(entry.id)}>Pokaż historię</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setEntryToDelete(entry)} className="text-red-600">Usuń</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!entryToEdit} onOpenChange={() => setEntryToEdit(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edytuj wpis czasu pracy</DialogTitle>
                        <DialogDescription>
                            Wprowadź poprawki i obowiązkowo podaj powód zmiany.
                        </DialogDescription>
                    </DialogHeader>
                    {entryToEdit && <EditEntryForm entry={entryToEdit} onSuccess={handleUpdateSuccess} />}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!entryToDelete} onOpenChange={() => setEntryToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tej operacji nie można cofnąć. Proszę, podaj krótki powód usunięcia.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="delete-reason">Powód usunięcia</Label> {/* Poprawiony Label */}
                        <Input
                            id="delete-reason"
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            placeholder="Np. duplikat wpisu"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleteReason.length < 5} className="bg-destructive hover:bg-destructive/90">
                            Tak, usuń
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Historia Zmian Wpisu</DialogTitle>
                        <DialogDescription>
                            Zobacz historię zmian.
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        {auditLogs.length > 0 ? (
                            <ul className="space-y-4 max-h-[60vh] overflow-y-auto"> {/* Dodano scrollowanie */}
                                {auditLogs.map((log: AuditLog) => ( // Typ 'any' tymczasowo
                                    <li key={log.id} className="p-3 border rounded-md">
                                        <p className="font-semibold">
                                            {log.editor?.first_name || 'Nieznany'} {log.editor?.last_name || ''}
                                            <span className="font-normal text-muted-foreground"> - {new Date(log.created_at).toLocaleString('pl-PL')}</span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">{log.change_reason || '-'}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : <p>Brak historii zmian dla tego wpisu.</p>}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}