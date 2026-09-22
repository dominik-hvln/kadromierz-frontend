import { SCHEDULE_ABSENCE_MARK } from '@/lib/absence-types';

/**
 * Wyświetlanie grafiku: jedno źródło decyzji „co pokazać w danym dniu” dla widoku
 * tabeli, kalendarza, obu PDF-ów i CSV.
 *
 * Zasada prywatności: grafik NIGDY nie pokazuje rodzaju nieobecności (urlop / L4 / …),
 * tylko wspólny znak „N”. Rodzaj i powód są w panelu Nieobecności i w ewidencji.
 */

const ABSENCE_STATUSES = ['on_leave', 'sick_leave', 'replacement_needed'];

export interface ScheduleOverlayAbsence {
    user_id: string;
    date: string;
    pending: boolean;
    first_name: string;
    last_name: string;
}

/** Odpowiedź GET /schedules/overlay. */
export interface ScheduleOverlay {
    workOnWeekends: boolean;
    workOnHolidays: boolean;
    absences: ScheduleOverlayAbsence[];
}

export const EMPTY_OVERLAY: ScheduleOverlay = { workOnWeekends: false, workOnHolidays: false, absences: [] };

export type ScheduleCell =
    /** Nieobecność: zaakceptowana („N”) albo oczekująca na akceptację („N?”). */
    | { kind: 'absence'; label: string; pending: boolean; needsReplacement: boolean; plannedHours: string | null }
    /** Święto jako dzień wolny (firma nie pracuje w święta). */
    | { kind: 'holiday'; label: 'ŚW'; holidayName: string }
    /** Zaplanowana zmiana; isHoliday = praca w święto (firma pracuje w święta). */
    | { kind: 'shift'; label: string; shiftName: string; hours: string; isHoliday: boolean; holidayName: string | null }
    /** Brak zmiany. */
    | { kind: 'off'; label: ''; isWeekend: boolean; isHoliday: boolean };

/** "07:00" -> "7", "07:30" -> "7:30" */
function fmtHour(t?: string | null): string {
    if (!t) return '';
    const [h, m] = t.split(':');
    return m && m !== '00' ? `${parseInt(h, 10)}:${m}` : `${parseInt(h, 10)}`;
}

/** Godziny zmiany w skrócie, np. "7-15" albo "22-6". */
export function formatShiftHours(start?: string | null, end?: string | null): string {
    if (!start || !end) return '';
    return `${fmtHour(start)}-${fmtHour(end)}`;
}

/** Indeks nieobecności: `${userId}|${date}` -> pending. */
export function indexOverlay(overlay: ScheduleOverlay): Map<string, boolean> {
    const map = new Map<string, boolean>();
    for (const a of overlay.absences) map.set(`${a.user_id}|${a.date}`, a.pending);
    return map;
}

/** Wiersz tabeli schedules (pola używane przy wyświetlaniu). */
export interface ScheduleRow {
    date?: string;
    shift_name?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    requires_replacement?: boolean | null;
    users?: { first_name?: string; last_name?: string } | null;
}

/** Zdarzenie grafiku z page.tsx. raw = null dla nieobecności bez zaplanowanej zmiany. */
export interface ScheduleEventLike {
    userId?: string;
    status?: string;
    raw?: ScheduleRow | null;
}

interface ResolveInput {
    /** Zdarzenie grafiku (zmiana) z page.tsx — ma status i raw z wierszem schedules. */
    event?: ScheduleEventLike | null;
    /** Z indexOverlay: undefined = brak nieobecności, false = zaakceptowana, true = oczekująca. */
    absencePending?: boolean;
    holiday?: { name?: string } | null;
    isWeekend: boolean;
    workOnWeekends: boolean;
    workOnHolidays: boolean;
    /** Oczekujące wnioski pokazujemy tylko na ekranie managera, nie na wydrukach. */
    includePending: boolean;
}

export function resolveScheduleCell({
    event,
    absencePending,
    holiday,
    isWeekend,
    workOnWeekends,
    workOnHolidays,
    includePending,
}: ResolveInput): ScheduleCell {
    const raw = event?.raw;
    const plannedHours = raw ? formatShiftHours(raw.start_time, raw.end_time) || null : null;
    const needsReplacement = Boolean(raw?.requires_replacement) || event?.status === 'replacement_needed';
    const holidayName = holiday ? holiday.name || 'Święto' : null;

    // 0) Święto, w które firma nie pracuje i nikt nie ma zmiany: „ŚW” — także gdy urlop
    //    obejmuje ten dzień (tak samo jak w ewidencji: święto nie zużywa dnia urlopu).
    if (!raw && holidayName && !workOnHolidays) {
        return { kind: 'holiday', label: 'ŚW', holidayName };
    }

    // Weekend, w który firma nie pracuje, bez zmiany — zwykły dzień wolny, bez „N”
    // (urlop nie obejmuje dni wolnych, ewidencja też ich nie liczy).
    if (!raw && isWeekend && !workOnWeekends) {
        return { kind: 'off', label: '', isWeekend: true, isHoliday: Boolean(holidayName) };
    }

    // 1) Zaakceptowana nieobecność — z wniosku albo ze statusu zmiany (także ustawionego ręcznie).
    const approvedAbsence = absencePending === false || (event?.status && ABSENCE_STATUSES.includes(event.status));
    if (approvedAbsence) {
        return {
            kind: 'absence',
            label: needsReplacement ? `${SCHEDULE_ABSENCE_MARK}*` : SCHEDULE_ABSENCE_MARK,
            pending: false,
            needsReplacement,
            plannedHours,
        };
    }

    // 2) Wniosek oczekujący — tylko na ekranie (manager/admin i sam autor).
    if (absencePending === true && includePending) {
        return { kind: 'absence', label: `${SCHEDULE_ABSENCE_MARK}?`, pending: true, needsReplacement: false, plannedHours };
    }

    // 3) Zaplanowana zmiana (także ręcznie dodana w święto — jawna decyzja managera).
    if (raw) {
        const hours = plannedHours || (raw.shift_name || '').substring(0, 5);
        return {
            kind: 'shift',
            label: hours,
            shiftName: raw.shift_name || '',
            hours,
            isHoliday: Boolean(holidayName),
            holidayName,
        };
    }

    return { kind: 'off', label: '', isWeekend, isHoliday: Boolean(holidayName) };
}

/**
 * Lista pracowników do tabeli/wydruku: z grafiku + ci, którzy mają tylko nieobecność
 * (inaczej osoba na całomiesięcznym urlopie zniknęłaby z grafiku).
 */
export function collectScheduleUsers(
    events: ScheduleEventLike[],
    overlay: ScheduleOverlay,
    includePending: boolean,
): { id: string; first_name: string; last_name: string }[] {
    const map = new Map<string, { id: string; first_name: string; last_name: string }>();
    for (const e of events) {
        const u = e.raw?.users;
        if (e.userId && u && !map.has(e.userId)) {
            map.set(e.userId, { id: e.userId, first_name: u.first_name || '', last_name: u.last_name || '' });
        }
    }
    for (const a of overlay.absences) {
        if (a.pending && !includePending) continue;
        if (!map.has(a.user_id)) {
            map.set(a.user_id, { id: a.user_id, first_name: a.first_name, last_name: a.last_name });
        }
    }
    return [...map.values()].sort((a, b) =>
        `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, 'pl'),
    );
}

/** Legenda wspólna dla widoku i wydruków grafiku. */
export const SCHEDULE_LEGEND = {
    absence: `${SCHEDULE_ABSENCE_MARK} = nieobecność`,
    replacement: `${SCHEDULE_ABSENCE_MARK}* = nieobecność, zmiana wymaga zastępstwa`,
    pending: `${SCHEDULE_ABSENCE_MARK}? = wniosek oczekuje na akceptację`,
    holiday: 'ŚW = święto (dzień wolny)',
};

/* ------------------------------------------------------------------------- */
/* Starsze helpery (używane przez SingleUserPrint) — bez rodzaju nieobecności. */
/* ------------------------------------------------------------------------- */

export function getScheduleCellLabel(
    status: string,
    requiresReplacement?: boolean,
    shiftName?: string,
): string {
    if (ABSENCE_STATUSES.includes(status)) {
        return requiresReplacement || status === 'replacement_needed'
            ? `${SCHEDULE_ABSENCE_MARK}*`
            : SCHEDULE_ABSENCE_MARK;
    }
    if (shiftName) {
        return shiftName.length > 3 ? `${shiftName.substring(0, 3)}.` : shiftName;
    }
    return '-';
}

export function getScheduleStatusText(
    status: string,
    requiresReplacement?: boolean,
    shiftName?: string,
    startTime?: string,
    endTime?: string,
): { status: string; hours: string } {
    if (ABSENCE_STATUSES.includes(status)) {
        const needs = requiresReplacement || status === 'replacement_needed';
        return { status: needs ? 'Nieobecność (wymaga zastępstwa)' : 'Nieobecność', hours: '-' };
    }
    if (shiftName && startTime && endTime) {
        return {
            status: shiftName,
            hours: `${startTime.substring(0, 5)} - ${endTime.substring(0, 5)}`,
        };
    }
    return { status: '-', hours: '-' };
}
