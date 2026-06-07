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
import type { AxiosError } from 'axios';
import { TimeEntryCard } from './TimeEntryCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScanConfirmDialog, SWITCH_TASK_CONFIRM } from './ScanConfirmDialog';
import {
    formatCooldown,
    getCooldownRemainingMs,
    isScanOnCooldown,
    markScanPerformed,
} from '@/lib/scan-cooldown';

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

type RawEntry = {
    id: string;
    start_time?: string;
    startTime?: string;
    task_id?: string | null;
    taskId?: string | null;
    task?: { id?: string | null; name?: string } | null;
    taskName?: string;
};

type PendingAction =
    | { type: 'scan'; code: string }
    | { type: 'switch'; taskId: string };

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

function TimeTrackerWidget() {
    const [isNative, setIsNative] = useState(false);
    const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [cooldownMs, setCooldownMs] = useState(0);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');
    const lastScanRef = useRef<{ value: string; at: number } | null>(null);
    const nativeScanLockRef = useRef(false);
    const pendingActionRef = useRef<PendingAction | null>(null);

    const refreshCooldown = useCallback(async () => {
        const remaining = await getCooldownRemainingMs();
        setCooldownMs(remaining);
    }, []);

    useEffect(() => {
        void refreshCooldown();
        const interval = setInterval(() => { void refreshCooldown(); }, 1000);
        return () => clearInterval(interval);
    }, [refreshCooldown]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [entryRes, tasksRes] = await Promise.all([
                api.get('/time-entries/my-active'),
                api.get('/tasks/my'),
            ]);
            setActiveEntry(normalizeEntry(entryRes.data));
            setAvailableTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
        } catch (error) {
            console.error('[fetchData] Błąd:', error);
            toast.error('Nie udało się pobrać statusu.');
            setActiveEntry(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const isSyncingRef = useRef(false);
    const syncOfflineScans = useCallback(async (showToast = true) => {
        if (isSyncingRef.current) return;
        isSyncingRef.current = true;
        try {
            const { keys } = await Preferences.keys();
            const offlineScanKeys = keys.filter((k) => k.startsWith('offline_scan_'));
            if (offlineScanKeys.length === 0) return;
            if (showToast) toast.info(`Synchronizuję ${offlineScanKeys.length} wpisów…`);
            for (const key of offlineScanKeys) {
                const { value } = await Preferences.get({ key });
                if (!value) continue;
                try {
                    const scanData: OfflineScan = JSON.parse(value);
                    await api.post('/time-entries/scan', scanData);
                    await Preferences.remove({ key });
                    await markScanPerformed();
                } catch (e) {
                    console.warn('Błąd synchronizacji wpisu', key, e);
                }
            }
            if (showToast) toast.success('Synchronizacja offline zakończona.');
            await fetchData();
            await refreshCooldown();
        } finally {
            isSyncingRef.current = false;
        }
    }, [fetchData, refreshCooldown]);

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
        fetchData();
        const networkListenerPromise = Network.addListener('networkStatusChange', async (status) => {
            if (status.connected) await syncOfflineScans(false);
        });
        return () => {
            networkListenerPromise.then((l) => l.remove());
        };
    }, [fetchData, syncOfflineScans]);

    const getLocation = async () => {
        if (!Capacitor.isNativePlatform()) return null;
        try {
            await Geolocation.requestPermissions();
            const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
            return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        } catch (e) {
            console.warn('[GPS] Nie udało się pobrać lokalizacji:', e);
            return null;
        }
    };

    const executeScan = async (code: string) => {
        setIsSubmitting(true);
        const location = await getLocation();
        const scanData: OfflineScan = {
            qrCodeValue: code,
            location,
            timestamp: new Date().toISOString(),
            id: `offline_scan_${Date.now()}`,
        };

        try {
            const response = await api.post('/time-entries/scan', scanData);
            const status = String(response?.data?.status || '').trim();
            const raw = response?.data?.entry ?? response?.data?.newEntry ?? null;
            const entry = normalizeEntry(raw);

            await markScanPerformed();
            await refreshCooldown();

            if (status === 'clock_in') {
                setActiveEntry(entry);
                toast.success(entry?.task ? 'Rozpoczęto pracę nad zleceniem!' : 'Dzień pracy rozpoczęty.');
            } else if (status === 'clock_out') {
                setActiveEntry(null);
                toast.info('Zakończono pracę!');
            } else {
                toast.error('Nieznany status odpowiedzi z serwera.');
            }
        } catch (err) {
            const axiosError = err as AxiosError<unknown, unknown>;
            if (axiosError.response?.status === 429) {
                const msg = (axiosError.response.data as { message?: string })?.message;
                toast.error('Zbyt szybko', { description: msg || 'Poczekaj przed kolejnym skanowaniem.' });
                await refreshCooldown();
                return;
            }
            const net = await Network.getStatus();
            if (!net.connected || !axiosError.response) {
                await Preferences.set({ key: scanData.id, value: JSON.stringify(scanData) });
                toast.info('Brak połączenia. Zapisano wpis offline.');
                if (!activeEntry) {
                    setActiveEntry({ id: scanData.id, start_time: scanData.timestamp, task: null, task_id: null });
                } else {
                    setActiveEntry(null);
                }
            } else {
                const msg = (axiosError.response.data as { message?: string } | undefined)?.message;
                toast.error('Błąd serwera', { description: msg || 'Nie udało się zarejestrować czasu.' });
            }
        } finally {
            setTimeout(() => setIsSubmitting(false), 500);
        }
    };

    const executeSwitchTask = async (taskId: string) => {
        setIsSubmitting(true);
        const location = await getLocation();
        try {
            const response = await api.post('/time-entries/switch-task', { taskId, location });
            const raw = response?.data?.entry ?? response?.data?.newEntry ?? null;
            const newEntry = normalizeEntry(raw);
            setActiveEntry(newEntry);
            await markScanPerformed();
            await refreshCooldown();
            toast.success('Rozpoczęto nowe zlecenie!');
        } catch (err) {
            const axiosError = err as AxiosError<unknown, unknown>;
            if (axiosError.response?.status === 429) {
                const msg = (axiosError.response.data as { message?: string })?.message;
                toast.error('Zbyt szybko', { description: msg || 'Poczekaj przed kolejną akcją.' });
                await refreshCooldown();
                return;
            }
            const msg = (axiosError.response?.data as { message?: string } | undefined)?.message;
            toast.error('Nie udało się przełączyć zlecenia.', { description: msg });
        } finally {
            setTimeout(() => setIsSubmitting(false), 500);
        }
    };

    const handleConfirm = async () => {
        const action = pendingActionRef.current;
        setConfirmOpen(false);
        pendingActionRef.current = null;
        if (!action) return;

        if (action.type === 'scan') {
            await executeScan(action.code);
        } else {
            await executeSwitchTask(action.taskId);
        }
    };

    const handleCancelConfirm = () => {
        setConfirmOpen(false);
        pendingActionRef.current = null;
    };

    const guardAction = async (): Promise<boolean> => {
        if (await isScanOnCooldown()) {
            const remaining = await getCooldownRemainingMs();
            toast.info('Blokada skanowania', {
                description: `Możesz ponownie skanować za ${formatCooldown(remaining)}.`,
            });
            return false;
        }
        if (isSubmitting) return false;
        return true;
    };

    const openScanConfirm = async (code: string) => {
        if (!(await guardAction())) return;

        const now = Date.now();
        const last = lastScanRef.current;
        if (last && last.value === code && now - last.at < 3000) return;
        lastScanRef.current = { value: code, at: now };

        try {
            const preview = await api.post('/time-entries/scan/preview', { qrCodeValue: code });
            const action: PendingAction = { type: 'scan', code };
            pendingActionRef.current = action;
            setConfirmTitle(preview.data.title);
            setConfirmMessage(preview.data.message);
            setConfirmOpen(true);
        } catch (err) {
            const axiosError = err as AxiosError<unknown, unknown>;
            const msg = (axiosError.response?.data as { message?: string })?.message;
            toast.error('Nieprawidłowy kod', { description: msg || 'Nie rozpoznano kodu QR.' });
        }
    };

    const openSwitchConfirm = async (taskId: string) => {
        if (!taskId || !(await guardAction())) return;
        const action: PendingAction = { type: 'switch', taskId };
        pendingActionRef.current = action;
        setConfirmTitle(SWITCH_TASK_CONFIRM.title);
        setConfirmMessage(SWITCH_TASK_CONFIRM.message);
        setConfirmOpen(true);
    };

    const startNativeScan = async () => {
        if (nativeScanLockRef.current || isSubmitting || cooldownMs > 0) return;
        nativeScanLockRef.current = true;
        setIsScanning(true);
        try {
            const res = await CapacitorBarcodeScanner.scanBarcode({ hint: CapacitorBarcodeScannerTypeHint.QR_CODE });
            const code = (res as unknown as { ScanResult?: string }).ScanResult || '';
            if (code) await openScanConfirm(code);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            if (!/cancelled|canceled/i.test(msg)) toast.error('Błąd skanera', { description: msg });
        } finally {
            setIsScanning(false);
            nativeScanLockRef.current = false;
        }
    };

    const handleWebScanSuccess = (result: IDetectedBarcode[]) => {
        const code = result?.[0]?.rawValue;
        if (code) void openScanConfirm(code);
    };

    const handleWebScanError = (error: unknown) => {
        if (error instanceof Error && !error.message.includes('No QR code found')) {
            console.error('Błąd skanera webowego:', error.message);
        }
    };

    const isBlocked = isSubmitting || isScanning || cooldownMs > 0;
    const cooldownLabel = cooldownMs > 0 ? `Blokada: ${formatCooldown(cooldownMs)}` : null;

    if (isLoading) {
        return (
            <div className="glassmorphism-box p-6 flex items-center justify-center min-h-[200px]">
                <p className="text-muted-foreground">Ładowanie statusu…</p>
            </div>
        );
    }

    return (
        <>
            <ScanConfirmDialog
                open={confirmOpen}
                title={confirmTitle}
                message={confirmMessage}
                onConfirm={() => { void handleConfirm(); }}
                onCancel={handleCancelConfirm}
            />

            {!activeEntry ? (
                <div className="glassmorphism-box p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <h1 className="text-2xl font-bold mb-6 text-center">Gotowy do pracy?</h1>
                    {cooldownLabel && (
                        <p className="text-sm text-muted-foreground mb-4">{cooldownLabel}</p>
                    )}
                    {isNative ? (
                        <Button onClick={startNativeScan} className="h-16 text-xl w-full max-w-xs" disabled={isBlocked}>
                            {isSubmitting || isScanning ? 'Przetwarzanie…' : cooldownLabel ?? 'Skanuj Kod QR'}
                        </Button>
                    ) : (
                        <div className="w-full max-w-sm border-2 border-dashed rounded-lg p-2">
                            {!isBlocked ? (
                                <WebScanner
                                    onScan={handleWebScanSuccess}
                                    onError={handleWebScanError}
                                    constraints={{ facingMode: 'environment' }}
                                    allowMultiple={false}
                                />
                            ) : (
                                <p className="text-center text-sm text-muted-foreground py-8">
                                    {cooldownLabel ?? 'Przetwarzanie…'}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">Zeskanuj kod zlecenia lub kod ogólny (np. „Biuro”).</p>
                        </div>
                    )}
                </div>
            ) : !activeEntry.task_id ? (
                <div className="glassmorphism-box p-6 space-y-6">
                    <TimeEntryCard entry={activeEntry} />
                    {cooldownLabel && <p className="text-sm text-muted-foreground">{cooldownLabel}</p>}
                    <div className="space-y-2">
                        <p className="text-sm">Wybierz zlecenie, aby zacząć nad nim pracę:</p>
                        <Select onValueChange={(v) => { void openSwitchConfirm(v); }} disabled={isBlocked}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Wybierz zlecenie" /></SelectTrigger>
                            <SelectContent>
                                {availableTasks.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>{t.name} ({t.project?.name || 'Brak proj.'})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">Lub zakończ dzień pracy, skanując kod ogólny:</p>
                        <Button onClick={isNative ? startNativeScan : undefined} className="w-full" variant="secondary" disabled={isBlocked}>
                            {isSubmitting || isScanning ? 'Przetwarzanie…' : cooldownLabel ?? 'Zeskanuj kod ogólny'}
                        </Button>
                        {!isNative && !isBlocked && (
                            <div className="mt-4">
                                <WebScanner onScan={handleWebScanSuccess} onError={handleWebScanError} constraints={{ facingMode: 'environment' }} allowMultiple={false} />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="glassmorphism-box p-6 space-y-6">
                    <TimeEntryCard entry={activeEntry} />
                    {cooldownLabel && <p className="text-sm text-muted-foreground">{cooldownLabel}</p>}
                    <Button onClick={isNative ? startNativeScan : undefined} className="w-full mt-6" variant="destructive" disabled={isBlocked}>
                        {isSubmitting || isScanning ? 'Przetwarzanie…' : cooldownLabel ?? 'Zakończ zlecenie (Zeskanuj QR)'}
                    </Button>
                    {!isNative && !isBlocked && (
                        <div className="mt-4">
                            <WebScanner onScan={handleWebScanSuccess} onError={handleWebScanError} constraints={{ facingMode: 'environment' }} allowMultiple={false} />
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

export default TimeTrackerWidget;
export { TimeTrackerWidget };
