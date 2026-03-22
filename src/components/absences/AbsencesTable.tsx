import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Absence } from '@/app/dashboard/absences/page';

interface Props {
    absences: Absence[];
    isLoading: boolean;
    isManagerView: boolean;
    onStatusChange?: (id: string, status: 'approved' | 'rejected') => void;
    onDelete?: (id: string) => void;
}

export default function AbsencesTable({ absences, isLoading, isManagerView, onStatusChange, onDelete }: Props) {
    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Ładowanie...</div>;
    }

    if (absences.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Brak wniosków do wyświetlenia.</div>;
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'approved': return 'Zaakceptowany';
            case 'rejected': return 'Odrzucony';
            default: return 'Oczekujący';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'urlop_wypoczynkowy': return 'Urlop Wypoczynkowy';
            case 'l4': return 'Zwolnienie Lekarskie (L4)';
            case 'urlop_na_zadanie': return 'Urlop na Żądanie';
            default: return 'Inne';
        }
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {isManagerView && <TableHead>Pracownik</TableHead>}
                    <TableHead>Typ</TableHead>
                    <TableHead>Od</TableHead>
                    <TableHead>Do</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Zgłoszono</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {absences.map((absence) => (
                    <TableRow key={absence.id}>
                        {isManagerView && (
                            <TableCell className="font-medium">
                                {absence.user?.first_name} {absence.user?.last_name}
                            </TableCell>
                        )}
                        <TableCell>{getTypeLabel(absence.type)}</TableCell>
                        <TableCell>{format(new Date(absence.start_date), 'dd MMM yyyy', { locale: pl })}</TableCell>
                        <TableCell>{format(new Date(absence.end_date), 'dd MMM yyyy', { locale: pl })}</TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(absence.status)}`}>
                                {getStatusText(absence.status)}
                            </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(absence.created_at), 'dd.MM.yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                            {isManagerView && absence.status === 'pending' && onStatusChange && (
                                <>
                                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => onStatusChange(absence.id, 'approved')}>
                                        <CheckCircle className="h-4 w-4 mr-1" /> Akceptuj
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => onStatusChange(absence.id, 'rejected')}>
                                        <XCircle className="h-4 w-4 mr-1" /> Odrzuć
                                    </Button>
                                </>
                            )}
                            {!isManagerView && absence.status === 'pending' && onDelete && (
                                <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => onDelete(absence.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
