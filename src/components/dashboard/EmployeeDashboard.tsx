'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { Geolocation } from '@capacitor/geolocation';
import { api } from '@/lib/api';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { Scanner as WebScanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { AxiosError } from "axios";
import { TimeEntryCard } from './TimeEntryCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Definicje typów
interface Task {
    id: string;
    name: string;
    project: { name: string };
}
interface TimeEntry {
    id: string;
    start_time: string;
    task: { name: string } | null;
    task_id: string | null;
}
interface OfflineScan {
    qrCodeValue: string;
    location: { latitude: number; longitude: number } | null;
    timestamp: string;
    id: string;
}

const useIsSyncing = () => {
    const isSyncingRef = useRef(false);
    return isSyncingRef;
};

export function EmployeeDashboard() {
    const [isNative, setIsNative] = useState(false);
    const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isSyncingRef = useIsSyncing();

    // --- 1. POBIERANIE DANYCH (TYLKO PRZY STARCIE) ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [entryRes, tasksRes] = await Promise.all([
                api.get('/time-entries/my-active'),
                api.get('/tasks/my'),
            ]);
            setActiveEntry(entryRes.data || null);
            setAvailableTasks(tasksRes.data);
        } catch (error: unknown) {
            console.error('[fetchData] Błąd:', error);
            toast.error('Błąd', { description: 'Nie udało się pobrać statusu.' });
            setActiveEntry(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- 2. SYNCHRONIZACJA OFFLINE (BEZ ZMIAN) ---
    const syncOfflineScans = useCallback(async (showToast = true) => {
        if (isSyncingRef.current) { return; }
        isSyncingRef.current = true;
        try {
            const { keys } = await Preferences.keys();
            const offlineScanKeys = keys.filter(key => key.startsWith('offline_scan_'));
            if (offlineScanKeys.length === 0) return;
            if (showToast) toast.info(`Synchronizuję ${offlineScanKeys.length} wpisów...`);
            let syncOk = true;
            for (const key of offlineScanKeys) {
                const { value } = await Preferences.get({ key });
                if (value) {
                    try {
                        const scanData: OfflineScan = JSON.parse(value);
                        await api.post('/time-entries/scan', scanData);
                        await Preferences.remove({ key });
                    } catch (error) {
                        console.error(`Błąd synchronizacji skanu ${key}:`, error);
                        syncOk = false; break;
                    }
                }
            }
            if (syncOk && offlineScanKeys.length > 0) {
                const { keys: remainingKeys } = await Preferences.keys();
                if (remainingKeys.filter(k => k.startsWith('offline_scan_')).length === 0) {
                    if (showToast) toast.success('Dane offline zostały zsynchronizowane!');
                    fetchData(); // Odśwież widok
                }
            }
        } finally {
            isSyncingRef.current = false;
        }
    }, [fetchData, isSyncingRef]);

    // --- 3. GŁÓWNY useEffect ---
    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
        fetchData();
        syncOfflineScans(false);
        const networkListenerPromise = Network.addListener('networkStatusChange', (status) => {
            if (status.connected) syncOfflineScans();
        });
        return () => { networkListenerPromise.then(listener => listener.remove()); };
    }, [fetchData, syncOfflineScans]);


    // --- 4. OBSŁUGA SKANU QR (BEZ WYŚCIGU) ---
    const handleScanResult = async (content: string) => {
        let location = null;
        try {
            if (Capacitor.isNativePlatform()) {
                await Geolocation.requestPermissions();
                const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
                location = { latitude: coordinates.coords.latitude, longitude: coordinates.coords.longitude };
            }
        } catch (error) { console.warn('[handleScanResult] Błąd GPS:', error); }

        const scanData: OfflineScan = { qrCodeValue: content, location, timestamp: new Date().toISOString(), id: `offline_scan_${Date.now()}` };

        try {
            const response = await api.post('/time-entries/scan', scanData);
            if (!response || !response.data || typeof response.data.status !== 'string') {
                toast.error('Błąd krytyczny: Nieprawidłowa odpowiedź serwera.');
                return;
            }

            const status = response.data.status.trim();
            const entryData = response.data.entry || response.data.newEntry ? { ...(response.data.entry) } : null;

            // --- KLUCZOWA ZMIANA: BRAK `fetchData()` ---
            if (status === 'clock_in') {
                toast.success('Rozpoczęto pracę!');
                setActiveEntry(entryData); // Ustawiamy stan na nowy wpis
            } else if (status === 'clock_out') {
                toast.info('Zakończono pracę!');
                setActiveEntry(null); // Czyścimy stan
            } else {
                toast.error(`Nieznany status operacji: ${status}`);
            }

        } catch (error: unknown) {
            const axiosError = error as AxiosError;
            const networkStatus = await Network.getStatus();
            if (!networkStatus.connected || !axiosError.response) {
                await Preferences.set({ key: scanData.id, value: JSON.stringify(scanData) });
                toast.info('Brak połączenia. Zapisano dane offline.');
                if(activeEntry) {
                    setActiveEntry(null);
                } else {
                    setActiveEntry({ id: scanData.id, start_time: scanData.timestamp, task: null, task_id: null });
                }
            } else {
                const errorMessage = (axiosError.response?.data as { message: string })?.message;
                toast.error('Błąd serwera', { description: errorMessage || 'Nie udało się zarejestrować czasu.' });
            }
        }
    };

    // --- 5. OBSŁUGA SKANERA (BEZ ZMIAN) ---
    const startNativeScan = async () => {
        try {
            const result = await CapacitorBarcodeScanner.scanBarcode({ hint: CapacitorBarcodeScannerTypeHint.QR_CODE });
            if (result.ScanResult) handleScanResult(result.ScanResult);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (!errorMessage.toLowerCase().includes('cancelled') && !errorMessage.toLowerCase().includes('canceled')) {
                toast.error('Błąd skanera', { description: errorMessage });
            }
        }
    };
    const handleWebScanSuccess = (result: IDetectedBarcode[]) => {
        if (result && result.length > 0) handleScanResult(result[0].rawValue);
    };
    const handleWebScanError = (error: unknown) => {
        if (error instanceof Error && !error.message.includes('No QR code found')) {
            console.error('Błąd skanera webowego:', error.message);
        }
    };

    // --- 6. OBSŁUGA ZMIANY TASK-A Z LISTY (BEZ WYŚCIGU) ---
    const handleSwitchTask = async (taskId: string) => {
        if (!taskId) return;
        let location = null;
        try {
            if (Capacitor.isNativePlatform()) {
                const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
                location = { latitude: coordinates.coords.latitude, longitude: coordinates.coords.longitude };
            }
        } catch (e: unknown) { console.warn("[handleSwitchTask] Błąd GPS:", e); }

        try {
            const response = await api.post('/time-entries/switch-task', { taskId, location });
            const newEntry = response.data.newEntry ? { ...response.data.newEntry } : null;

            // --- KLUCZOWA ZMIANA: BRAK `fetchData()` ---
            setActiveEntry(newEntry); // Ustawiamy stan bezpośrednio
            toast.success('Rozpoczęto nowe zlecenie!');
        } catch (error: unknown) {
            console.error('[handleSwitchTask] Błąd API:', error);
            const axiosError = error as AxiosError;
            const errorMessage = (axiosError.response?.data as { message: string })?.message;
            toast.error('Błąd', { description: errorMessage || 'Nie udało się rozpocząć zlecenia.' });
        }
    };

    // --- 7. RENDEROWANIE (BEZ ZMIAN) ---
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