export type AbsenceCode = 'U' | 'NŻ' | 'L4' | 'I';

/**
 * Kody nieobecności w grafiku — celowo te same, których używa miesięczna
 * ewidencja (MonthlyReportExport), żeby kadrowa czytała oba dokumenty
 * tym samym kluczem.
 */
const CODE_BY_TYPE: Record<string, AbsenceCode> = {
    urlop_wypoczynkowy: 'U',
    urlop_na_zadanie: 'NŻ',
    l4: 'L4',
    inne: 'I',
};

const LABEL_BY_CODE: Record<AbsenceCode, string> = {
    'U': 'Urlop wypoczynkowy',
    'NŻ': 'Urlop na żądanie',
    'L4': 'Zwolnienie lekarskie (L4)',
    'I': 'Inna nieobecność',
};

export const ABSENCE_LEGEND =
    'U = urlop wypoczynkowy, NŻ = urlop na żądanie, L4 = zwolnienie lekarskie, I = inna nieobecność';

/**
 * Kod nieobecności dla komórki grafiku albo null, gdy to zwykła zmiana.
 *
 * Wpisy sprzed wprowadzenia kolumny absence_type nie mają typu — dla nich
 * zostaje rozróżnienie po statusie, czyli tyle, ile dało się wtedy zapisać.
 */
export function getAbsenceCode(status?: string, absenceType?: string | null): AbsenceCode | null {
    if (absenceType && CODE_BY_TYPE[absenceType]) return CODE_BY_TYPE[absenceType];
    if (status === 'sick_leave' || status === 'replacement_needed') return 'L4';
    if (status === 'on_leave') return 'U';
    return null;
}

export function getAbsenceLabel(code: AbsenceCode): string {
    return LABEL_BY_CODE[code];
}

export function getScheduleCellLabel(
    status: string,
    requiresReplacement?: boolean,
    shiftName?: string,
    absenceType?: string | null,
): string {
    const code = getAbsenceCode(status, absenceType);
    if (code) {
        if (status === 'replacement_needed') return `${code} (zast.)`;
        return requiresReplacement ? `${code} (zast.)` : code;
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
    absenceType?: string | null,
): { status: string; hours: string } {
    const code = getAbsenceCode(status, absenceType);
    if (code) {
        const needsReplacement = requiresReplacement || status === 'replacement_needed';
        const label = needsReplacement
            ? `${getAbsenceLabel(code)} (wymaga zastępstwa)`
            : getAbsenceLabel(code);
        const hours = startTime && endTime
            ? `${startTime.substring(0, 5)} - ${endTime.substring(0, 5)} (wg grafiku)`
            : 'Wg grafiku';
        return { status: label, hours };
    }
    if (shiftName && startTime && endTime) {
        return {
            status: shiftName,
            hours: `${startTime.substring(0, 5)} - ${endTime.substring(0, 5)}`,
        };
    }
    return { status: '-', hours: '-' };
}
