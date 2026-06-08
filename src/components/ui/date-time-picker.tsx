'use client';

import * as React from "react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    formatWarsawPickerLabel,
    isoToWarsawParts,
    warsawWallClockToIso,
} from "@/lib/datetime";

interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
}

export function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  const parsed = value ? isoToWarsawParts(value) : null;

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    parsed ? parseISO(`${parsed.dateStr}T12:00:00`) : undefined,
  );
  const [hour, setHour] = React.useState<string>(parsed?.hour ?? "08");
  const [minute, setMinute] = React.useState<string>(parsed?.minute ?? "00");

  React.useEffect(() => {
    if (!value) return;
    const parts = isoToWarsawParts(value);
    setSelectedDate(parseISO(`${parts.dateStr}T12:00:00`));
    setHour(parts.hour);
    setMinute(parts.minute);
  }, [value]);

  const emitChange = (date: Date, h: string, m: string) => {
    onChange?.(warsawWallClockToIso(date, h, m));
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
    if (newDate && onChange) {
      emitChange(newDate, hour, minute);
    }
  };

  const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
    const nextHour = type === 'hour' ? val : hour;
    const nextMinute = type === 'minute' ? val : minute;
    if (type === 'hour') setHour(val);
    if (type === 'minute') setMinute(val);

    if (selectedDate && onChange) {
      emitChange(selectedDate, nextHour, nextMinute);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="flex flex-col gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal h-10",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              formatWarsawPickerLabel(value)
            ) : (
              <span>{label || "Wybierz datę i godzinę"}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            locale={pl}
          />
          <div className="p-3 border-t flex items-center gap-2 justify-center bg-muted/50">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1">
              <Select value={hour} onValueChange={(v) => handleTimeChange('hour', v)}>
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">:</span>
              <Select value={minute} onValueChange={(v) => handleTimeChange('minute', v)}>
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
