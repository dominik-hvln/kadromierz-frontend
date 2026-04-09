'use client';

import React, { useMemo } from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { format, getDaysInMonth } from 'date-fns';
import { pl } from 'date-fns/locale';

// Podpinamy tę samą bezpieczną czcionkę wektorową
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Roboto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '1.5pt solid #222',
    paddingBottom: 12,
    marginBottom: 20,
  },
  titleGroup: {
    flexDirection: 'column',
  },
  mainTitle: {
    fontSize: 18,
    color: '#111',
    fontWeight: 'bold',
  },
  employeeName: {
    fontSize: 14,
    color: '#2563eb',
    marginTop: 4,
    fontWeight: 'normal',
  },
  periodInfo: {
    fontSize: 11,
    color: '#666',
    marginTop: 8,
  },
  table: {
    width: '100%',
    flexDirection: 'column',
    border: '1pt solid #ddd',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottom: '1pt solid #ccc',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #eee',
  },
  colData: {
    width: '15%',
    borderRight: '1pt solid #eee',
    padding: 6,
    justifyContent: 'center',
  },
  colDzien: {
    width: '20%',
    borderRight: '1pt solid #eee',
    padding: 6,
    justifyContent: 'center',
  },
  colStatus: {
    width: '40%',
    borderRight: '1pt solid #eee',
    padding: 6,
    justifyContent: 'center',
  },
  colGodziny: {
    width: '25%',
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textHeader: {
    fontSize: 10,
    color: '#333',
    fontWeight: 'bold',
  },
  textCell: {
    fontSize: 10,
    color: '#333',
  },
  textCellWeekend: {
    fontSize: 10,
    color: '#dc2626', // red-600
  },
  textCellHoliday: {
    fontSize: 10,
    color: '#d97706', // amber-600
  },
  bgWeekend: {
    backgroundColor: '#fef2f2',
  },
  bgHoliday: {
    backgroundColor: '#fffbeb',
  },
  footer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signatureLine: {
    fontSize: 11,
    color: '#444',
  }
});

interface Props {
  month: number;
  year: number;
  events: any[];
  holidays: any[];
  user: any;
}

export const SingleUserPdfDocument = ({ month, year, events, holidays, user }: Props) => {
  const daysInMonth = useMemo(() => {
      const date = new Date(year, month - 1, 1);
      const count = getDaysInMonth(date);
      return Array.from({ length: count }, (_, i) => new Date(year, month - 1, i + 1));
  }, [month, year]);

  if (!user) return null;

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Text style={styles.mainTitle}>Miesięczny Grafik Pracy</Text>
            <Text style={styles.employeeName}>{user.first_name} {user.last_name}</Text>
            <Text style={styles.periodInfo}>Okres: {format(new Date(year, month - 1, 1), 'LLLL yyyy', { locale: pl }).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableRowHeader}>
            <View style={{...styles.colData, borderRight: '1pt solid #ccc'}}><Text style={styles.textHeader}>Data</Text></View>
            <View style={{...styles.colDzien, borderRight: '1pt solid #ccc'}}><Text style={styles.textHeader}>Dzień</Text></View>
            <View style={{...styles.colStatus, borderRight: '1pt solid #ccc'}}><Text style={styles.textHeader}>Status / Zmiana</Text></View>
            <View style={styles.colGodziny}><Text style={styles.textHeader}>Godziny racy</Text></View>
          </View>

          {/* Body Rows */}
          {daysInMonth.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isHoliday = holidays.find(h => h.date === dateStr);
              const ev = events.find(e => e.userId === user.id && e.raw?.date === dateStr);

              let rowStyle: any = styles.tableRow;
              let textStyle = styles.textCell;
              
              let status = '-';
              let hours = '-';

              if (isHoliday) {
                  rowStyle = { ...styles.tableRow, ...styles.bgHoliday };
                  textStyle = styles.textCellHoliday;
                  status = `WOLNE (${isHoliday.name || ''})`;
              } else if (ev) {
                  if (ev.status === 'replacement_needed') {
                      status = 'L4 / Urlop';
                  } else {
                      status = ev.raw.shift_name;
                      hours = `${ev.raw.start_time.substring(0, 5)} - ${ev.raw.end_time.substring(0, 5)}`;
                  }
              } else if (isWeekend) {
                  rowStyle = { ...styles.tableRow, ...styles.bgWeekend };
                  textStyle = styles.textCellWeekend;
                  status = 'Weekend';
              }

              return (
                <View key={dateStr} style={rowStyle}>
                  <View style={styles.colData}><Text style={textStyle}>{format(day, 'dd.MM')}</Text></View>
                  <View style={styles.colDzien}><Text style={textStyle}>{format(day, 'eeee', { locale: pl })}</Text></View>
                  <View style={styles.colStatus}><Text style={textStyle}>{status}</Text></View>
                  <View style={styles.colGodziny}><Text style={textStyle}>{hours}</Text></View>
                </View>
              );
          })}
        </View>

        <View style={styles.footer}>
            <Text style={styles.signatureLine}>Podpis pracownika: ......................................................</Text>
        </View>

      </Page>
    </Document>
  );
};
