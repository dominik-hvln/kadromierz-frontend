/**
 * Rodzaje nieobecności — muszą być zgodne z backend/src/absences/absence-types.ts.
 *
 * Rodzaj i powód widzi tylko autor wniosku, manager i admin (panel Nieobecności)
 * oraz ewidencja czasu pracy. Grafik i jego wydruki pokazują jeden wspólny znak.
 */
export const ABSENCE_TYPE_OPTIONS = [
    { value: 'urlop_wypoczynkowy', label: 'Urlop wypoczynkowy', code: 'U' },
    { value: 'urlop_na_zadanie', label: 'Urlop na żądanie', code: 'NŻ' },
    { value: 'l4', label: 'Zwolnienie lekarskie (L4)', code: 'L4' },
    { value: 'urlop_okolicznosciowy', label: 'Urlop okolicznościowy', code: 'UO' },
    { value: 'opieka', label: 'Opieka nad dzieckiem (art. 188)', code: 'OP' },
    { value: 'urlop_bezplatny', label: 'Urlop bezpłatny', code: 'UB' },
    { value: 'inne', label: 'Inna nieobecność', code: 'I' },
] as const;

export function absenceTypeLabel(type: string): string {
    return ABSENCE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? 'Inna nieobecność';
}

export function absenceTypeCode(type: string): string {
    return ABSENCE_TYPE_OPTIONS.find((o) => o.value === type)?.code ?? 'I';
}

/** Legenda literek ewidencji (dokument kadrowy). */
export const ABSENCE_CODES_LEGEND =
    ABSENCE_TYPE_OPTIONS.map((o) => `${o.code} = ${o.label.toLowerCase()}`).join(', ') + ', ŚW = święto';

/** Jeden wspólny znak nieobecności na grafiku — bez rodzaju. */
export const SCHEDULE_ABSENCE_MARK = 'N';
