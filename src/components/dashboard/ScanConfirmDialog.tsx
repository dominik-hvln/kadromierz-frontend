'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type ScanAction = 'clock_in' | 'clock_out' | 'switch_task';

interface ScanConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ScanConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Potwierdź',
    onConfirm,
    onCancel,
}: ScanConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{message}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>Anuluj</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export const SWITCH_TASK_CONFIRM = {
    title: 'Zmienić zlecenie?',
    message: 'Czy chcesz zakończyć bieżące zlecenie i rozpocząć nowe?',
};
