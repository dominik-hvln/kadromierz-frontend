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

// --- Normalizacja kształtu wpisu z API ---
// --- Normalizacja kształtu wpisu z API (bez `any`) ---
// Dopuszczamy różne kształty nazw pól z backendu i mapujemy je na TimeEntry
type RawEntry = {
    id: string;
    start_time?: string;
    startTime?: string;
    task_id?: string | null;
    taskId?: string | null;
    task?: { id?: string | null; name?: string } | null;
    taskName?: string;
};

const normalizeEntry = (e: unknown): TimeEntry | null => {
    if (!e || typeof e !== 'object') return null;
    const obj = e as Record<string, unknown>;
    const id = obj['id'];
    if (typeof id !== 'string') return null;

    const start_time =
        typeof obj['start_time'] === 'string'
            ? (obj['start_time'] as string)
            : typeof obj['startTime'] === 'string'
                ? (obj['startTime'] as string)
                : '';

    const taskObj = obj['task'] && typeof obj['task'] === 'object' ? (obj['task'] as Record<string, unknown>) : null;

    const task_id =
        typeof obj['task_id'] === 'string' || obj['task_id'] === null
            ? (obj['task_id'] as string | null)
            : typeof obj['taskId'] === 'string' || obj['taskId'] === null
                ? (obj['taskId'] as string | null)
                : taskObj && typeof taskObj['id'] === 'string'
                    ? (taskObj['id'] as string)
                    : null;

    const task =
        taskObj && typeof taskObj['name'] === 'string'
            ? { name: taskObj['name'] as string }
            : typeof obj['taskName'] === 'string'
                ? { name: obj['taskName'] as string }
                : null;

    return { id, start_time, task_id, task } as TimeEntry;
};

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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isSyncingRef = useIsSyncing();

    // Debounce skanów na WWW
    const lastScanRef = useRef<{ value: string; at: number } | null>(null);
    const SCAN_COOLDOWN_MS = 1500;

    // --- 1. POBIERANIE DANYCH ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [entryRes, tasksRes] = await Promise.all([
                api.get('/time-entries/my-active'),
                api.get('/tasks/my'),
            ]);
            setActiveEntry(normalizeEntry(entryRes.data) || null);
            setAvailableTasks(tasksRes.data);
        } catch (error: unknown) {
            console.error('[fetchData] Błąd:', error);
            toast.error('Błąd', { description: 'Nie udało się pobrać statusu.' });
            setActiveEntry(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- 2. SYNCHRONIZACJA OFFLINE ---
    const syncOfflineScans = useCallback(async (showToast = true) => {
        if (isSyncingRef.current) { return; }
        isSyncingRef.current = true;
        try {
            const { keys } = await Preferences.keys();
            const offlineScanKeys = keys.filter(key => key.startsWith('offline_scan_'));
            if (offlineScanKeys.length === 0) return;
            if (showToast) toast.info(`Synchronizuję ${offlineScanKeys.length} wpisów...`);

            for (const key of offlineScanKeys) {
                const { value } = await Preferences.get({ key });
                if (!value) continue;
                const scanData: OfflineScan = JSON.parse(value);
                try {
                    await api.post('/time-entries/scan', scanData);
                    await Preferences.remove({ key });
                } catch (error) {
                    console.warn('Nie udało się zsynchronizować wpisu', key, error);
                }
            }
            if (showToast) toast.success('Synchronizacja offline zakończona.');
            await fetchData();
        } finally {
            isSyncingRef.current = false;
        }
    }, [fetchData]);

    // --- 3. EFEKTY ---
    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
        fetchData();

        const networkListenerPromise = Network.addListener('networkStatusChange', async (status) => {
            if (status.connected) await syncOfflineScans(false);
        });
        return () => { networkListenerPromise.then(listener => listener.remove()); };
    }, [fetchData, syncOfflineScans]);


    // --- 4. OBSŁUGA SKANU QR (BEZ WYŚCIGU) ---
    const handleScanResult = async (content: string) => {
        if (isSubmitting) return; // Blokada przed podwójnym kliknięciem
        setIsSubmitting(true);

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
            // Zapisujemy dane z odpowiedzi API
            const entryData = normalizeEntry(response.data.entry);

            // --- KLUCZOWA ZMIANA: BRAK `fetchData()` ---
            if (status === 'clock_in') {
                toast.success('Rozpoczęto pracę!');
                setActiveEntry(entryData); // Ustawiamy stan na nowy wpis
            } else if (status === 'clock_out') {
                toast.info('Zakończono pracę!');
                setActiveEntry(null);
                lastScanRef.current = null; // wyczyść ostatni skan
                // Czyścimy stan
            } else {
                toast.error(`Nieznany status operacji: ${status}`);
            }

        } catch (error: unknown) {
            const axiosError = error as AxiosError<unknown, unknown>;
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
        } finally {
            setTimeout(() => setIsSubmitting(false), 800); // krótki cooldown przed kolejnym skanem
        }
    };

    // --- 5. OBSŁUGA SKANERA (WWW / NATIVE) ---
    const startNativeScan = async () => {
        if (isSubmitting) return; // Zapobiegaj skanowaniu, jeśli poprzednie jest przetwarzane
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
        if (isSubmitting) return;
        if (!(result && result.length > 0)) return;
        const code = result[0].rawValue;
        if (!code) return;

        const now = Date.now();
        const last = lastScanRef.current;
        if (last && last.value === code && now - last.at < SCAN_COOLDOWN_MS) {
            return; // ignoruj powtórkę tego samego kodu
        }
        lastScanRef.current = { value: code, at: now };
        handleScanResult(code);
    };

    const handleWebScanError = (error: unknown) => {
        if (error instanceof Error && !error.message.includes('No QR code found')) {
            console.error('Błąd skanera webowego:', error.message);
        }
    };

    // --- 6. OBSŁUGA ZMIANY TASK-A Z LISTY (BEZ WYŚCIGU) ---
    const handleSwitchTask = async (taskId: string) => {
        if (!taskId || isSubmitting) return;
        setIsSubmitting(true);

        let location = null;
        try {
            if (Capacitor.isNativePlatform()) {
                const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
                location = { latitude: coordinates.coords.latitude, longitude: coordinates.coords.longitude };
            }
        } catch (e: unknown) { console.warn("[handleSwitchTask] Błąd GPS:", e); }

        try {
            const response = await api.post('/time-entries/switch-task', { taskId, location });
            const raw = response.data.entry ?? response.data.newEntry ?? null;
            const newEntry = normalizeEntry(raw);

            // --- KLUCZOWA ZMIANA: BRAK `fetchData()` ---
            setActiveEntry(newEntry); // Ustawiamy stan bezpośrednio
            toast.success('Rozpoczęto nowe zlecenie!');
        } catch (error: unknown) {
            console.error('[handleSwitchTask] Błąd API:', error);
            const axiosError = error as AxiosError<unknown, unknown>;
            const errorMessage = (axiosError.response?.data as { message: string })?.message;
            toast.error('Błąd', { description: errorMessage || 'Nie udało się rozpocząć zlecenia.' });
        } finally {
            setTimeout(() => setIsSubmitting(false), 800); // krótki cooldown
        }
    };

    // --- 7. RENDEROWANIE (DODANO 'disabled' DO PRZYCISKÓW) ---
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground">Ładowanie statusu...</p>
            </div>
        );
    }

    // Widok: NIE W PRACY
    if (!activeEntry) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 pt-12 md:pt-4">
                <h1 className="text-3xl font-bold mb-8 text-center">Gotowy do pracy?</h1>
                {isNative ? (
                    <Button onClick={startNativeScan} className="h-16 text-xl w-full max-w-xs" disabled={isSubmitting}>
                        {isSubmitting ? 'Przetwarzanie...' : 'Skanuj Kod QR'}
                    </Button>
                ) : (
                    <div className="w-full max-w-sm border-2 border-dashed rounded-lg p-2">
                        <WebScanner
                            onScan={handleWebScanSuccess}
                            onError={handleWebScanError}
                            constraints={{ facingMode: 'environment' }}
                            allowMultiple={false}
                        />
                        <p className="text-xs text-muted-foreground mt-2">Zeskanuj kod zlecenia lub kod ogólny (np. „Biuro”).</p>
                    </div>
                )}
            </div>
        );
    }

    // Widok: W PRACY — OGÓLNY (bez task_id)
    if (activeEntry && !activeEntry.task_id) {
        return (
            <div className="p-4 pt-12 md:pt-4 space-y-6">
                <TimeEntryCard entry={activeEntry} />

                <div className="space-y-2">
                    <p className="text-sm">Wybierz zlecenie, aby zacząć nad nim pracę:</p>
                    <Select onValueChange={handleSwitchTask}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Wybierz zlecenie" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableTasks.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <p className="text-xs text-muted-foreground mb-2">Lub zakończ dzień pracy, skanując kod ogólny:</p>
                    <Button onClick={isNative ? startNativeScan : undefined} className="w-full" variant="secondary" disabled={isSubmitting}>
                        {isSubmitting ? 'Przetwarzanie...' : 'Zakończ dzień (Zeskanuj QR)'}
                    </Button>
                    {!isNative && (
                        <div className="mt-4">
                            <WebScanner
                                onScan={handleWebScanSuccess}
                                onError={handleWebScanError}
                                constraints={{ facingMode: 'environment' }}
                                allowMultiple={false}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Widok: W PRACY — KONKRETNE ZLECENIE (ma task_id)
    return (
        <div className="p-4 pt-12 md:pt-4">
            <TimeEntryCard entry={activeEntry} />
            <Button onClick={isNative ? startNativeScan : undefined} className="w-full mt-6" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? 'Przetwarzanie...' : 'Zakończ zlecenie (Zeskanuj QR)'}
            </Button>
            {!isNative && (
                <div className="mt-4">
                    <WebScanner
                        onScan={handleWebScanSuccess}
                        onError={handleWebScanError}
                        constraints={{ facingMode: 'environment' }}
                        allowMultiple={false}
                    />
                </div>
            )}
        </div>
    );
}
