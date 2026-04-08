'use client';

import React, { useMemo } from 'react';
import { Page, Text, View, Document, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { format, getDaysInMonth } from 'date-fns';
import { pl } from 'date-fns/locale';
import { UrbanistRegular } from '@/lib/fonts/Urbanist-Regular-normal';

// Rejestrujemy natywny form dla PDF
Font.register({
  family: 'Urbanist',
  src: `data:font/truetype;charset=utf-8;base64,${UrbanistRegular}`,
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontFamily: 'Urbanist',
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
  shiftL4: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
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
  legendBoxL4: { width: 10, height: 10, backgroundColor: '#fee2e2', borderRadius: 2 },
  legendText: { fontSize: 8, color: '#555' }
});

interface Props {
  month: number;
  year: number;
  events: any[];
  holidays: any[];
}

export const CollectiveSchedulePDFDocument = ({ month, year, events, holidays }: Props) => {
  const daysInMonth = useMemo(() => {
      const date = new Date(year, month - 1, 1);
      const count = getDaysInMonth(date);
      return Array.from({ length: count }, (_, i) => new Date(year, month - 1, i + 1));
  }, [month, year]);

  const users = useMemo(() => {
      const usersMap = new Map();
      events.forEach(e => {
          if (!usersMap.has(e.userId) && e.raw?.users) {
              usersMap.set(e.userId, e.raw.users);
          }
      });
      return Array.from(usersMap.values()).sort((a, b) => a.last_name.localeCompare(b.last_name));
  }, [events]);

  const renderBadge = (shiftName: string) => {
      const name = shiftName.toLowerCase();
      if (name.includes('rano')) return <Text style={styles.shiftBadgeRano}>Rano</Text>;
      if (name.includes('pop')) return <Text style={styles.shiftBadgePopo}>Popo.</Text>;
      if (name.includes('noc')) return <Text style={styles.shiftBadgeNoc}>Noc</Text>;
      return <Text style={styles.shiftBadgeOther}>{shiftName.substring(0, 4)}</Text>;
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
            <Text style={styles.headerRight}>System Aplikacja Czasu Pracy</Text>
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
                return (
                  <View key={day.toISOString()} style={isWeekend ? styles.colDayWeekend : styles.colDay}>
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
                  const isHoliday = holidays.find(h => h.date === dateStr);
                  const ev = events.find(e => e.userId === user.id && e.raw?.date === dateStr);

                  let colStyle = styles.colDay;
                  if (isWeekend) colStyle = styles.colDayWeekend;
                  if (isHoliday) colStyle = styles.colDayHoliday;

                  return (
                    <View key={dateStr} style={colStyle}>
                      {isHoliday ? (
                          <Text style={styles.holidayText}>W</Text>
                      ) : ev ? (
                          ev.status === 'replacement_needed' 
                              ? <Text style={styles.shiftL4}>L4</Text>
                              : renderBadge(ev.raw.shift_name)
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
            <View style={styles.legendItem}><View style={styles.legendBoxHoliday} /><Text style={styles.legendText}>Święto</Text></View>
            <View style={styles.legendItem}><View style={styles.legendBoxWeekend} /><Text style={styles.legendText}>Weekend</Text></View>
            <View style={styles.legendItem}><View style={styles.legendBoxL4} /><Text style={styles.legendText}>Urlop/L4</Text></View>
        </View>
      </Page>
    </Document>
  );
};
