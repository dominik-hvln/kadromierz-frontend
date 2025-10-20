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

// Hook useRef do śledzenia synchronizacji
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

    // Logowanie zmian stanu dla diagnostyki
    useEffect(() => {
        const renderId = Math.random().toString(36).substring(7);
        console.log(`[State Update ${renderId}] Zmiana activeEntry. Nowa wartość:`, activeEntry);
    }, [activeEntry]);

    // Funkcja pobierania danych
    const fetchData = useCallback(async () => {
        console.log('[fetchData] Start');
        setIsLoading(true); // Ustaw ładowanie na początku
        try {
            const [entryRes, tasksRes] = await Promise.all([
                api.get('/time-entries/my-active'),
                api.get('/tasks'),
            ]);
            console.log('[fetchData] Otrzymano activeEntry:', entryRes.data);
            setActiveEntry(entryRes.data || null); // Ustawiamy null, jeśli API zwróci pustą odpowiedź
            setAvailableTasks(tasksRes.data);
        } catch (error: unknown) {
            console.error('[fetchData] Błąd:', error);
            const errorMessage = error instanceof Error ? error.message : 'Nie udało się pobrać aktualnego statusu.';
            toast.error('Błąd', { description: errorMessage });
            setActiveEntry(null); // W razie błędu zakładamy stan wylogowany
        } finally {
            setIsLoading(false); // Ustawiamy isLoading na false na końcu
            console.log('[fetchData] Koniec');
        }
    }, []);

    // Funkcja synchronizacji offline
    const syncOfflineScans = useCallback(async (showToast = true) => {
        if (isSyncingRef.current) { console.log('[syncOffline] Już trwa, pomijam.'); return; }
        isSyncingRef.current = true;
        console.log('[syncOffline] Start');
        try {
            const { keys } = await Preferences.keys();
            const offlineScanKeys = keys.filter(key => key.startsWith('offline_scan_'));
            if (offlineScanKeys.length === 0) {
                console.log('[syncOffline] Brak skanów.');
                return;
            }
            if (showToast) toast.info(`Synchronizuję ${offlineScanKeys.length} wpisów offline...`);
            let syncOk = true;
            for (const key of offlineScanKeys) {
                const { value } = await Preferences.get({ key });
                if (value) {
                    try {
                        const scanData: OfflineScan = JSON.parse(value);
                        console.log(`[syncOffline] Wysyłam skan: ${key}`);
                        await api.post('/time-entries/scan', scanData);
                        await Preferences.remove({ key });
                        console.log(`[syncOffline] Usunięto skan: ${key}`);
                    } catch (error) {
                        console.error(`[syncOffline] Błąd synchronizacji skanu ${key}:`, error);
                        syncOk = false;
                        break;
                    }
                }
            }
            if (syncOk) {
                const { keys: remainingKeys } = await Preferences.keys();
                if (remainingKeys.filter(k => k.startsWith('offline_scan_')).length === 0) {
                    if (showToast) toast.success('Dane offline zostały zsynchronizowane!');
                    console.log('[syncOffline] Sukces, odświeżam dane...');
                    fetchData(); // Odśwież widok po udanej synchronizacji
                }
            } else {
                console.log('[syncOffline] Synchronizacja przerwana.');
            }
        } finally {
            isSyncingRef.current = false;
            console.log('[syncOffline] Koniec');
        }
    }, [fetchData, isSyncingRef]);

    // Główny useEffect do inicjalizacji
    useEffect(() => {
        console.log('[useEffect] Montowanie komponentu.');
        setIsNative(Capacitor.isNativePlatform());
        fetchData();
        syncOfflineScans(false);
        const networkListenerPromise = Network.addListener('networkStatusChange', (status) => {
            console.log('[useEffect] Zmiana sieci:', status);
            if (status.connected) syncOfflineScans();
        });
        return () => {
            console.log('[useEffect] Odmontowywanie komponentu.');
            networkListenerPromise.then(listener => listener.remove());
        };
    }, [fetchData, syncOfflineScans]);

    // Funkcja obsługująca wynik skanowania (z logowaniem i funkcją zwrotną dla setState)
    const handleScanResult = async (content: string) => {
        console.log(`\n\n--- [SCAN START FINAL v3] Kod: ${content} ---`);
        let location = null;
        try {
            if (Capacitor.isNativePlatform()) {
                console.log('[SCAN FINAL v3] Pobieram GPS...');
                await Geolocation.requestPermissions();
                const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
                location = { latitude: coordinates.coords.latitude, longitude: coordinates.coords.longitude };
                console.log('[SCAN FINAL v3] GPS OK.');
            }
        } catch (error) { console.warn('[SCAN FINAL v3] Błąd GPS:', error); }

        const scanData: OfflineScan = { qrCodeValue: content, location, timestamp: new Date().toISOString(), id: `offline_scan_${Date.now()}` };
        console.log('[SCAN FINAL v3] Dane do API:', scanData);

        try {
            console.log('[SCAN FINAL v3] Wysyłam do API...');
            const response = await api.post('/time-entries/scan', scanData);
            console.log('[SCAN FINAL v3] Surowa odpowiedź API:', response);

            if (!response || !response.data || typeof response.data.status !== 'string') {
                console.error('[SCAN FINAL v3] BŁĄD: Nieprawidłowa odpowiedź API!');
                toast.error('Błąd krytyczny: Nieprawidłowa odpowiedź serwera.');
                return;
            }

            const status = response.data.status.trim();
            const entryDataFromApi = response.data.entry || response.data.newEntry ? { ...(response.data.entry || response.data.newEntry) } : null;
            console.log(`[SCAN FINAL v3] Otrzymany status: "${status}"`);
            console.log('[SCAN FINAL v3] Otrzymane entryData:', entryDataFromApi);

            // --- Logika ustawiania stanu z funkcją zwrotną ---
            if (status === 'clock_in') { // Uproszczony warunek
                console.log('[SCAN FINAL v3] -> DECYZJA: START');
                toast.success('Rozpoczęto pracę!');
                setActiveEntry(() => {
                    console.log('[SCAN FINAL v3] Wewnątrz setActiveEntry (START), ustawiam na:', entryDataFromApi);
                    return entryDataFromApi;
                });
            } else if (status === 'clock_out') { // Uproszczony warunek
                console.log('[SCAN FINAL v3] -> DECYZJA: STOP');
                toast.info('Zakończono pracę!');
                setActiveEntry(() => {
                    console.log('[SCAN FINAL v3] Wewnątrz setActiveEntry (STOP), ustawiam na: null');
                    return null;
                });
            } else {
                console.log(`[SCAN FINAL v3] -> DECYZJA: INNY (${status})`);
                toast.error(`Nieznany status operacji: ${status}`);
                fetchData(); // Spróbuj odświeżyć
            }
            console.log('[SCAN FINAL v3] Zakończono obsługę odpowiedzi.');

        } catch (error: unknown) {
            console.error('[SCAN FINAL v3] --- BŁĄD API ---');
            const axiosError = error as AxiosError;
            console.error('[SCAN FINAL v3] Szczegóły błędu Axios:', JSON.stringify(axiosError.toJSON ? axiosError.toJSON() : error));
            const networkStatus = await Network.getStatus();
            console.log('[SCAN FINAL v3] Status sieci w momencie błędu:', networkStatus);

            if (!networkStatus.connected || !axiosError.response) {
                console.log('[SCAN FINAL v3] Zapisuję offline...');
                await Preferences.set({ key: scanData.id, value: JSON.stringify(scanData) });
                toast.info('Brak połączenia lub serwer nie odpowiada. Zapisano dane offline.');
                const temporaryEntry: TimeEntry = {
                    id: scanData.id, start_time: scanData.timestamp, task: null, task_id: null
                };
                console.log('[SCAN FINAL v3] Ustawiam tymczasowy activeEntry (offline):', temporaryEntry);
                setActiveEntry(temporaryEntry); // Użyj bezpośredniego ustawienia dla offline
            } else {
                console.log('[SCAN FINAL v3] Błąd odpowiedzi serwera.');
                const errorMessage = (axiosError.response?.data as { message: string })?.message;
                toast.error('Błąd serwera', { description: errorMessage || 'Nie udało się zarejestrować czasu.' });
            }
        }
        console.log(`--- [SCAN KONIEC FINAL v3] ---`);
    };

    // Funkcja uruchamiająca skaner natywny
    const startNativeScan = async () => {
        console.log('[startNativeScan] Start');
        try {
            const result = await CapacitorBarcodeScanner.scanBarcode({ hint: CapacitorBarcodeScannerTypeHint.QR_CODE });
            console.log('[startNativeScan] Wynik:', result);
            if (result.ScanResult) {
                handleScanResult(result.ScanResult);
            } else {
                console.log('[startNativeScan] Anulowano.');
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[startNativeScan] Błąd:', errorMessage);
            if (!errorMessage.toLowerCase().includes('cancelled') && !errorMessage.toLowerCase().includes('canceled')) {
                toast.error('Błąd skanera', { description: errorMessage });
            } else {
                console.log('[startNativeScan] Anulowano (catch).');
            }
        }
    };

    // Funkcje obsługujące skaner webowy
    const handleWebScanSuccess = (result: IDetectedBarcode[]) => {
        console.log('[handleWebScanSuccess] Wykryto:', result);
        if (result && result.length > 0) handleScanResult(result[0].rawValue);
    };
    const handleWebScanError = (error: unknown) => {
        if (error instanceof Error && !error.message.includes('No QR code found')) {
            console.error('[handleWebScanError] Błąd:', error.message);
        }
    };

    // Funkcja do przełączania tasków
    const handleSwitchTask = async (taskId: string) => {
        console.log(`[handleSwitchTask] Start dla taska: ${taskId}`);
        let location = null;
        try {
            if (Capacitor.isNativePlatform()) {
                const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
                location = { latitude: coordinates.coords.latitude, longitude: coordinates.coords.longitude };
            }
        } catch (e: unknown) { console.warn("[handleSwitchTask] Błąd GPS:", e); }

        try {
            console.log('[handleSwitchTask] Wysyłam do API...');
            const response = await api.post('/time-entries/switch-task', { taskId, location });
            console.log('[handleSwitchTask] Odpowiedź API:', response.data);
            const newEntry = response.data.newEntry ? { ...response.data.newEntry } : null;
            // Używamy funkcji zwrotnej dla pewności
            setActiveEntry(() => {
                console.log('[handleSwitchTask] Ustawiam activeEntry na:', newEntry);
                return newEntry;
            });
            toast.success('Rozpoczęto nowe zlecenie!');
        } catch (error: unknown) {
            console.error('[handleSwitchTask] Błąd API:', error);
            const axiosError = error as AxiosError;
            const errorMessage = (axiosError.response?.data as { message: string })?.message;
            toast.error('Błąd', { description: errorMessage || 'Nie udało się rozpocząć zlecenia.' });
        }
    };

    // --- Renderowanie ---
    console.log(`[Render FINAL] isLoading: ${isLoading}, activeEntry ID: ${activeEntry?.id ?? 'null'}, Task ID: ${activeEntry?.task_id ?? 'null'}`);
    if (isLoading) {
        return <div className="p-4 text-center">Ładowanie statusu...</div>;
    }

    // Widok: NIE W PRACY
    if (!activeEntry) {
        console.log('[Render FINAL] -> Renderuję widok: NIE W PRACY');
        return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <h1 className="text-3xl font-bold mb-8 text-center">Gotowy do pracy?</h1>
                {isNative ? ( <Button onClick={startNativeScan} size="lg" className="h-16 text-xl w-full max-w-xs">Skanuj Kod QR</Button> ) : (
                    <div className="w-full max-w-sm border-2 border-dashed rounded-lg p-2">
                        <WebScanner onScan={handleWebScanSuccess} onError={handleWebScanError} />
                        <p className="text-sm text-center text-muted-foreground mt-2">Użyj kamery, aby zeskanować kod QR</p>
                    </div>
                )}
            </div>
        );
    }

    // Widok: W PRACY (OGÓLNY)
    if (activeEntry && !activeEntry.task_id) {
        console.log('[Render FINAL] -> Renderuję widok: W PRACY (OGÓLNY)');
        return (
            <div className="p-4">
                <TimeEntryCard entry={activeEntry} />
                <h2 className="text-2xl font-bold mt-6 mb-4">Wybierz zlecenie do rozpoczęcia</h2>
                <div className="space-y-2">
                    {availableTasks.length > 0 ? (
                        availableTasks.map(task => (
                            <div key={task.id} className="p-4 border rounded-lg flex justify-between items-center bg-card">
                                <div>
                                    <p className="font-semibold">{task.name}</p>
                                    <p className="text-sm text-muted-foreground">{task.project?.name || 'Brak projektu'}</p>
                                </div>
                                <Button onClick={() => handleSwitchTask(task.id)}>Rozpocznij</Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground">Brak dostępnych zleceń.</p>
                    )}
                </div>
                <Button onClick={startNativeScan} variant="destructive" className="w-full mt-8">Zakończ dzień pracy</Button>
            </div>
        );
    }

    // Widok: W PRACY (ZLECENIE)
    if (activeEntry && activeEntry.task_id) {
        console.log('[Render FINAL] -> Renderuję widok: W PRACY (ZLECENIE)');
        return (
            <div className="p-4">
                <TimeEntryCard entry={activeEntry} />
                <Button onClick={startNativeScan} variant="destructive" className="w-full mt-8">Zakończ zlecenie</Button>
            </div>
        );
    }

    console.warn('[Render FINAL] -> Nie dopasowano żadnego widoku (fallback na null)');
    return null;
}