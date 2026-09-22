'use client';

import React, { useMemo } from 'react';
import { Page, Text, View, Document, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { format, getDaysInMonth } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  ScheduleOverlay,
  SCHEDULE_LEGEND,
  collectScheduleUsers,
  indexOverlay,
  resolveScheduleCell,
} from '@/lib/schedule-display';

// Rejestrujemy czcionkę z polskimi znakami pobieraną dynamicznie by ominąć problematyczne w Base64 / WOFF2
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontFamily: 'Roboto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '1.5pt solid #333',
    paddingBottom: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    color: '#111',
  },
  subtitle: {
    fontSize: 12,
    color: '#444',
    marginTop: 4,
  },
  headerRight: {
    fontSize: 9,
    color: '#888',
    textAlign: 'right',
  },
  table: {
    width: '100%',
    flexDirection: 'column',
    border: '1pt solid #ddd',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottom: '1pt solid #ddd',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #f0f0f0',
  },
  colName: {
    width: 60,
    borderRight: '1pt solid #ddd',
    padding: 4,
    justifyContent: 'center',
  },
  colDay: {
    flex: 1,
    borderRight: '1pt solid #eee',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  colDayWeekend: {
    flex: 1,
    borderRight: '1pt solid #eee',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    backgroundColor: '#fef2f2',
  },
  colDayHoliday: {
    flex: 1,
    borderRight: '1pt solid #eee',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    backgroundColor: '#fffbeb',
  },
  textName: {
    fontSize: 8,
    color: '#222',
  },
  textDayHeaderNum: {
    fontSize: 8,
    color: '#444',
  },
  textDayHeaderName: {
    fontSize: 6,
    color: '#888',
    marginTop: 1,
  },
  shiftBadgeRano: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    borderRadius: 3,
    padding: 2,
    fontSize: 7,
    textAlign: 'center',
    width: '90%',
  },
  shiftBadgePopo: {
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    borderRadius: 3,
    padding: 2,
    fontSize: 7,
    textAlign: 'center',
    width: '90%',
  },
  shiftBadgeNoc: {
    backgroundColor: '#e2e8f0',
    color: '#334155',
    borderRadius: 3,
    padding: 2,
    fontSize: 7,
    textAlign: 'center',
    width: '90%',
  },
  shiftBadgeOther: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: 3,
    padding: 2,
    fontSize: 7,
    textAlign: 'center',
    width: '90%',
  },
  shiftAbsence: {
    backgroundColor: '#ede9fe',
    color: '#6d28d9',
    borderRadius: 3,
    padding: 2,
    fontSize: 7,
    textAlign: 'center',
    width: '90%',
  },
  holidayText: {
    color: '#d97706',
    fontSize: 8,
  },
  legend: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendBoxRano: { width: 10, height: 10, backgroundColor: '#e0f2fe', borderRadius: 2 },
  legendBoxPopo: { width: 10, height: 10, backgroundColor: '#e0e7ff', borderRadius: 2 },
  legendBoxHoliday: { width: 10, height: 10, backgroundColor: '#fffbeb', border: '1pt solid #fde68a', borderRadius: 2 },
  legendBoxWeekend: { width: 10, height: 10, backgroundColor: '#fef2f2', border: '1pt solid #fecaca', borderRadius: 2 },
  legendBoxAbsence: { width: 10, height: 10, backgroundColor: '#ede9fe', borderRadius: 2 },
  legendText: { fontSize: 8, color: '#555' }
});

interface Props {
  month: number;
  year: number;
  events: any[];
  holidays: any[];
  overlay: ScheduleOverlay;
}

export const CollectiveSchedulePDFDocument = ({ month, year, events, holidays, overlay }: Props) => {
  const daysInMonth = useMemo(() => {
      const date = new Date(year, month - 1, 1);
      const count = getDaysInMonth(date);
      return Array.from({ length: count }, (_, i) => new Date(year, month - 1, i + 1));
  }, [month, year]);

  // Wydruk: bez wniosków oczekujących — tylko to, co już zatwierdzone.
  const users = useMemo(() => collectScheduleUsers(events, overlay, false), [events, overlay]);
  const absenceIndex = useMemo(() => indexOverlay(overlay), [overlay]);

  // Pokazuje zdefiniowane godziny pracy (np. "7-19"); kolor wg typu zmiany.
  const renderBadge = (shiftName: string, hours: string) => {
      const name = (shiftName || '').toLowerCase();
      if (name.includes('rano')) return <Text style={styles.shiftBadgeRano}>{hours}</Text>;
      if (name.includes('pop')) return <Text style={styles.shiftBadgePopo}>{hours}</Text>;
      if (name.includes('noc')) return <Text style={styles.shiftBadgeNoc}>{hours}</Text>;
      return <Text style={styles.shiftBadgeOther}>{hours}</Text>;
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Zbiorczy Grafik Pracy</Text>
            <Text style={styles.subtitle}>Okres: {format(new Date(year, month - 1, 1), 'LLLL yyyy', { locale: pl }).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.headerRight}>Wygenerowano: {format(new Date(), 'dd.MM.yyyy HH:mm')}</Text>
            <Text style={styles.headerRight}>System Effixy</Text>
          </View>
        </View>

        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableRowHeader}>
            <View style={styles.colName}>
              <Text style={styles.textDayHeaderNum}>Pracownik</Text>
            </View>
            {daysInMonth.map(day => {
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const isHoliday = holidays.some(h => h.date === format(day, 'yyyy-MM-dd'));
                const headStyle = isHoliday ? styles.colDayHoliday : isWeekend ? styles.colDayWeekend : styles.colDay;
                return (
                  <View key={day.toISOString()} style={headStyle}>
                    <Text style={styles.textDayHeaderNum}>{format(day, 'dd')}</Text>
                    <Text style={styles.textDayHeaderName}>{format(day, 'eee', { locale: pl }).substring(0, 2)}</Text>
                  </View>
                );
            })}
          </View>

          {/* Body Rows */}
          {users.map(user => (
            <View key={user.id} style={styles.tableRow}>
              <View style={styles.colName}>
                <Text style={styles.textName}>{user.first_name}</Text>
                <Text style={styles.textName}>{user.last_name}</Text>
              </View>
              
              {daysInMonth.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const holiday = holidays.find(h => h.date === dateStr);
                  const cell = resolveScheduleCell({
                      event: events.find(e => e.userId === user.id && e.raw?.date === dateStr),
                      absencePending: absenceIndex.get(`${user.id}|${dateStr}`),
                      holiday,
                      isWeekend,
                      workOnWeekends: overlay.workOnWeekends,
                      workOnHolidays: overlay.workOnHolidays,
                      includePending: false,
                  });

                  let colStyle = styles.colDay;
                  if (isWeekend) colStyle = styles.colDayWeekend;
                  if (holiday) colStyle = styles.colDayHoliday;

                  return (
                    <View key={dateStr} style={colStyle}>
                      {cell.kind === 'absence' ? (
                          <Text style={styles.shiftAbsence}>{cell.label}</Text>
                      ) : cell.kind === 'holiday' ? (
                          <Text style={styles.holidayText}>{cell.label}</Text>
                      ) : cell.kind === 'shift' ? (
                          renderBadge(cell.shiftName, cell.hours)
                      ) : (
                          <Text style={{ fontSize: 7, color: '#aaa' }}>-</Text>
                      )}
                    </View>
                  );
              })}
            </View>
          ))}
        </View>

        <View style={styles.legend}>
            <View style={styles.legendItem}><View style={styles.legendBoxRano} /><Text style={styles.legendText}>Rano</Text></View>
            <View style={styles.legendItem}><View style={styles.legendBoxPopo} /><Text style={styles.legendText}>Popołudnie</Text></View>
            <View style={styles.legendItem}><View style={styles.legendBoxWeekend} /><Text style={styles.legendText}>Weekend</Text></View>
            <View style={styles.legendItem}>
                <View style={styles.legendBoxHoliday} />
                <Text style={styles.legendText}>{overlay.workOnHolidays ? 'Święto (dzień pracy)' : SCHEDULE_LEGEND.holiday}</Text>
            </View>
            <View style={styles.legendItem}><View style={styles.legendBoxAbsence} /><Text style={styles.legendText}>{SCHEDULE_LEGEND.absence}</Text></View>
            <View style={styles.legendItem}><View style={styles.legendBoxAbsence} /><Text style={styles.legendText}>{SCHEDULE_LEGEND.replacement}</Text></View>
        </View>
      </Page>
    </Document>
  );
};
