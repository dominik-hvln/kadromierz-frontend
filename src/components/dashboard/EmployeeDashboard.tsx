'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { Scanner as WebScanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { TimeEntryCard } from './TimeEntryCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Network } from '@capacitor/network'; // Potrzebne do listenera

// Importujemy nasz NOWY store
import { useEmployeeStore } from '@/store/employee.store';

export function EmployeeDashboard() {
    // Odczytujemy stan i akcje TYLKO ze store
    const {
        activeEntry,
        availableTasks,
        isLoading,
        fetchData,
        handleScan,
        handleSwitchTask,
        syncOfflineScans
    } = useEmployeeStore();

    const isNative = Capacitor.isNativePlatform();

    // Główny useEffect do inicjalizacji
    useEffect(() => {
        fetchData();
        syncOfflineScans(false); // Uruchom synchronizację w tle

        const networkListenerPromise = Network.addListener('networkStatusChange', (status) => {
            if (status.connected) syncOfflineScans();
        });
        return () => {
            networkListenerPromise.then(listener => listener.remove());
        };
    }, [fetchData, syncOfflineScans]);

    // Uproszczona funkcja skanowania (tylko wywołuje store)
    const startNativeScan = async () => {
        try {
            const result = await CapacitorBarcodeScanner.scanBarcode({ hint: CapacitorBarcodeScannerTypeHint.QR_CODE });
            if (result.ScanResult) {
                // Wywołujemy akcję ze store
                await handleScan(result.ScanResult);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (!errorMessage.toLowerCase().includes('cancelled') && !errorMessage.toLowerCase().includes('canceled')) {
                toast.error('Błąd skanera', { description: errorMessage });
            }
        }
    };

    // Uproszczona funkcja skanowania web (tylko wywołuje store)
    const handleWebScanSuccess = (result: IDetectedBarcode[]) => {
        if (result && result.length > 0) {
            handleScan(result[0].rawValue); // Wywołujemy akcję ze store
        }
    };

    const handleWebScanError = (error: unknown) => {
        if (error instanceof Error && !error.message.includes('No QR code found')) {
            console.error('Błąd skanera webowego:', error.message);
        }
    };

    // --- Renderowanie (bez zmian) ---

    if (isLoading) {
        return <div className="p-4 text-center">Ładowanie statusu...</div>;
    }

    // Widok: NIE W PRACY
    if (!activeEntry) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <h1 className="text-3xl font-bold mb-8 text-center">Gotowy do pracy?</h1>
                {isNative ? ( <Button onClick={startNativeScan} size="lg" className="h-16 text-xl w-full max-w-xs">Skanuj Kod QR</Button> ) : (
                    <div className="w-full max-w-sm border-2 border-dashed rounded-lg p-2">
                        <WebScanner onScan={handleWebScanSuccess} onError={handleWebScanError} />
                        <p className="text-sm text-center text-muted-foreground mt-2">Użyj kamery...</p>
                    </div>
                )}
            </div>
        );
    }

    // Widok: W PRACY (OGÓLNY)
    if (activeEntry && !activeEntry.task_id) {
        return (
            <div className="p-4">
                <TimeEntryCard entry={activeEntry} />
                <h2 className="text-2xl font-bold mt-6 mb-4">Wybierz zlecenie do rozpoczęcia</h2>
                <div className="space-y-2">
                    {availableTasks.length > 0 ? (
                        <Select onValueChange={(taskId) => handleSwitchTask(taskId)}>
                            <SelectTrigger><SelectValue placeholder="Wybierz zlecenie..." /></SelectTrigger>
                            <SelectContent>
                                {availableTasks.map(task => (
                                    <SelectItem key={task.id} value={task.id}>
                                        {task.name} ({task.project?.name || 'Brak proj.'})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <p className="text-center text-muted-foreground">Brak przypisanych zleceń.</p>
                    )}
                </div>
                <Button onClick={startNativeScan} variant="destructive" className="w-full mt-8">Zakończ dzień pracy</Button>
            </div>
        );
    }

    // Widok: W PRACY (ZLECENIE)
    if (activeEntry && activeEntry.task_id) {
        return (
            <div className="p-4">
                <TimeEntryCard entry={activeEntry} />
                <Button onClick={startNativeScan} variant="destructive" className="w-full mt-8">Zakończ zlecenie</Button>
            </div>
        );
    }

    return null;
}