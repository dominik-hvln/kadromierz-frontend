import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export const SCAN_COOLDOWN_MS = 2 * 60 * 1000;
const STORAGE_KEY = 'last_scan_at';

async function readLastScanAt(): Promise<number | null> {
    try {
        if (Capacitor.isNativePlatform()) {
            const { value } = await Preferences.get({ key: STORAGE_KEY });
            return value ? parseInt(value, 10) : null;
        }
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? parseInt(raw, 10) : null;
    } catch {
        return null;
    }
}

async function writeLastScanAt(ts: number): Promise<void> {
    const value = String(ts);
    if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: STORAGE_KEY, value });
    } else {
        localStorage.setItem(STORAGE_KEY, value);
    }
}

export async function getCooldownRemainingMs(): Promise<number> {
    const last = await readLastScanAt();
    if (!last) return 0;
    return Math.max(0, SCAN_COOLDOWN_MS - (Date.now() - last));
}

export async function isScanOnCooldown(): Promise<boolean> {
    return (await getCooldownRemainingMs()) > 0;
}

export async function markScanPerformed(): Promise<void> {
    await writeLastScanAt(Date.now());
}

export function formatCooldown(ms: number): string {
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
}
