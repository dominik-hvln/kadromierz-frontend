'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { AxiosError } from 'axios';

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

// Definicja stanu i akcji
interface EmployeeState {
    activeEntry: TimeEntry | null;
    availableTasks: Task[];
    isLoading: boolean;
    fetchData: () => Promise<void>;
    handleScan: (content: string) => Promise<void>;
    handleSwitchTask: (taskId: string) => Promise<void>;
    syncOfflineScans: (showToast?: boolean) => Promise<void>;
}

let isSyncing = false; // Flaga synchronizacji

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
    activeEntry: null,
    availableTasks: [],
    isLoading: true,

    // --- AKCJA 1: POBIERANIE DANYCH ---
    fetchData: async () => {
        console.log('[Store fetchData] Start');
        set({ isLoading: true });
        try {
            const [entryRes, tasksRes] = await Promise.all([
                api.get('/time-entries/my-active'),
                api.get('/tasks/my'), // Używamy endpointu /my
            ]);
            set({
                activeEntry: entryRes.data || null,
                availableTasks: tasksRes.data,
            });
        } catch (error: unknown) {
            console.error('[Store fetchData] Błąd:', error);
            const errorMessage = error instanceof Error ? error.message : 'Nie udało się pobrać statusu.';
            toast.error('Błąd', { description: errorMessage });
            set({ activeEntry: null });
        } finally {
            set({ isLoading: false });
            console.log('[Store fetchData] Koniec');
        }
    },

    // --- AKCJA 2: SYNCHRONIZACJA OFFLINE ---
    syncOfflineScans: async (showToast = true) => {
        if (isSyncing) { console.log('[syncOffline] Już trwa, pomijam.'); return; }
        isSyncing = true;
        console.log('[syncOffline] Start');
        try {
            const { keys } = await Preferences.keys();
            const offlineScanKeys = keys.filter(key => key.startsWith('offline_scan_'));
            if (offlineScanKeys.length === 0) {
                isSyncing = false;
                console.log('[syncOffline] Brak skanów.');
                return;
            }
            if (showToast) toast.info(`Synchronizuję ${offlineScanKeys.length} wpisów...`);
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
                    get().fetchData(); // Odśwież widok po udanej synchronizacji
                }
            } else {
                console.log('[syncOffline] Synchronizacja przerwana.');
            }
        } finally {
            isSyncing = false;
            console.log('[syncOffline] Koniec');
        }
    },

    // --- AKCJA 3: OBSŁUGA SKANOWANIA (LOGIKA OPTYMISTYCZNA) ---
    handleScan: async (content: string) => {
        console.log(`[Store handleScan] Start. Kod: ${content}`);
        const currentEntry = get().activeEntry;

        // 1. Aktualizacja optymistyczna (natychmiastowa zmiana UI)
        let tempEntry: TimeEntry | null = null;
        if (currentEntry) {
            console.log('[Store handleScan] UI: Zatrzymuję pracę (optymistycznie)');
            toast.info('Zakończono pracę...');
            set({ activeEntry: null }); // Natychmiast wyloguj
        } else {
            console.log('[Store handleScan] UI: Rozpoczynam pracę (optymistycznie)');
            toast.info('Rozpoczęto pracę...');
            tempEntry = { id: 'temp_scan', start_time: new Date().toISOString(), task: null, task_id: null };
            set({ activeEntry: tempEntry });
        }

        // 2. Pobierz GPS
        let location = null;
        try {
            if (Capacitor.isNativePlatform()) {
                await Geolocation.requestPermissions();
                const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
                location = { latitude: coordinates.coords.latitude, longitude: coordinates.coords.longitude };
            }
        } catch (error) { console.warn('[Store handleScan] Błąd GPS:', error); }

        const scanData: OfflineScan = { qrCodeValue: content, location, timestamp: new Date().toISOString(), id: `offline_scan_${Date.now()}` };

        // 3. Wyślij dane do API (w tle)
        try {
            console.log('[Store handleScan] Wysyłam do API...');
            const response = await api.post('/time-entries/scan', scanData);

            const status = response.data.status.trim();
            const entryData = response.data.entry || response.data.newEntry ? { ...(response.data.entry || response.data.newEntry) } : null;

            if (status === 'clock_in') {
                set({ activeEntry: entryData }); // Potwierdź rozpoczęcie
            } else {
                set({ activeEntry: null }); // Potwierdź zakończenie
            }
            console.log('[Store handleScan] Sukces API, stan zaktualizowany.');

        } catch (error: unknown) {
            console.error('[Store handleScan] Błąd API, zapisuję offline.', error);
            await Preferences.set({ key: scanData.id, value: JSON.stringify(scanData) });
            // Stan jest już ustawiony optymistycznie, więc UI jest poprawny
        }
    },

    // --- AKCJA 4: PRZEŁĄCZANIE ZADAŃ (LOGIKA OPTYMISTYCZNA) ---
    handleSwitchTask: async (taskId: string) => {
        console.log(`[Store handleSwitchTask] Start dla taska: ${taskId}`);

        const tasks = get().availableTasks;
        const switchedTask = tasks.find(t => t.id === taskId);
        const tempEntry: TimeEntry = {
            id: 'temp_switch',
            start_time: new Date().toISOString(),
            task: switchedTask ? { name: switchedTask.name } : null,
            task_id: taskId
        };
        set({ activeEntry: tempEntry });
        toast.success('Rozpoczęto nowe zlecenie!');

        let location = null;
        try {
            if (Capacitor.isNativePlatform()) {
                const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
                location = { latitude: coordinates.coords.latitude, longitude: coordinates.coords.longitude };
            }
        } catch (e) { console.warn("GPS nie był dostępny przy przełączaniu taska.") }

        try {
            console.log('[Store handleSwitchTask] Wysyłam do API...');
            const response = await api.post('/time-entries/switch-task', { taskId, location });
            set({ activeEntry: response.data.newEntry ? { ...response.data.newEntry } : null });
        } catch (error: unknown) {
            console.error('[Store handleSwitchTask] Błąd API:', error);
            toast.error('Błąd', { description: 'Nie udało się przełączyć zlecenia.' });
            get().fetchData();
        }
    },
}));