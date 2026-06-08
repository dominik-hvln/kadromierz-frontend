'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { formatTimePl } from '@/lib/datetime';

// Definiujemy dokładny typ dla `entry`
interface TimeEntryCardProps {
    entry: {
        start_time: string;
        task: { name: string } | null;
    };
}

export function TimeEntryCard({ entry }: TimeEntryCardProps) {
    const [time, setTime] = useState('');

    useEffect(() => {
        const startTime = parseISO(entry.start_time);
        if (!isNaN(startTime.getTime())) {
            const update = () => setTime(formatDistanceToNow(startTime, { addSuffix: true, locale: pl }));
            update();
            const interval = setInterval(update, 10000); // Aktualizuj co 10 sekund
            return () => clearInterval(interval);
        } else {
            setTime('Nieprawidłowy czas startu');
        }
    }, [entry.start_time]);

    return (
        <Card className="bg-primary text-primary-foreground text-center">
            <CardHeader>
                <CardTitle className="text-lg">
                    {entry.task ? `Pracujesz nad: ${entry.task.name}` : 'Dzień pracy rozpoczęty'}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
                <p>od {formatTimePl(entry.start_time)}</p>
                <p className="text-sm opacity-80">(upłynęło {time})</p>
            </CardContent>
        </Card>
    );
}