import { format, parseISO } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { pl } from 'date-fns/locale';

export const APP_TIMEZONE = 'Europe/Warsaw';

export function formatDateTimePl(iso: string | null | undefined): string {
    if (!iso) return '-';
    return formatInTimeZone(parseISO(iso), APP_TIMEZONE, 'dd.MM.yyyy HH:mm', { locale: pl });
}

export function formatTimePl(iso: string | null | undefined): string {
    if (!iso) return '-';
    return formatInTimeZone(parseISO(iso), APP_TIMEZONE, 'HH:mm', { locale: pl });
}

export function isoToWarsawParts(iso: string): { dateStr: string; hour: string; minute: string } {
    const d = parseISO(iso);
    return {
        dateStr: formatInTimeZone(d, APP_TIMEZONE, 'yyyy-MM-dd'),
        hour: formatInTimeZone(d, APP_TIMEZONE, 'HH'),
        minute: formatInTimeZone(d, APP_TIMEZONE, 'mm'),
    };
}

/** Data kalendarzowa (z pickera) + godzina ścienna w Warszawie → ISO UTC. */
export function warsawWallClockToIso(calendarDate: Date, hour: string, minute: string): string {
    const dateStr = format(calendarDate, 'yyyy-MM-dd');
    const hh = hour.padStart(2, '0');
    const mm = minute.padStart(2, '0');
    return fromZonedTime(`${dateStr}T${hh}:${mm}:00`, APP_TIMEZONE).toISOString();
}

export function formatWarsawPickerLabel(iso: string): string {
    return formatInTimeZone(parseISO(iso), APP_TIMEZONE, 'PPP HH:mm', { locale: pl });
}
