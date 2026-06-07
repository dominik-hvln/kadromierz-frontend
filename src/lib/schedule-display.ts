export function getScheduleCellLabel(
    status: string,
    requiresReplacement?: boolean,
    shiftName?: string,
): string {
    if (status === 'on_leave') {
        return requiresReplacement ? 'URL (zast.)' : 'URLOP';
    }
    if (status === 'sick_leave') {
        return requiresReplacement ? 'L4 (zast.)' : 'L4';
    }
    if (status === 'replacement_needed') {
        return 'L4/URL (zast.)';
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
    if (status === 'on_leave') {
        const label = requiresReplacement ? 'Urlop (wymaga zastępstwa)' : 'Urlop';
        const hours = startTime && endTime
            ? `${startTime.substring(0, 5)} - ${endTime.substring(0, 5)} (wykonane)`
            : 'Wykonane wg grafiku';
        return { status: label, hours };
    }
    if (status === 'sick_leave' || status === 'replacement_needed') {
        const label = status === 'sick_leave'
            ? (requiresReplacement ? 'L4 (wymaga zastępstwa)' : 'L4')
            : 'L4 / Urlop (wymaga zastępstwa)';
        const hours = startTime && endTime
            ? `${startTime.substring(0, 5)} - ${endTime.substring(0, 5)} (wykonane)`
            : 'Wykonane wg grafiku';
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
