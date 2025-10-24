'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
    LogIn,
    LogOut,
    Edit,
    Trash2,
    UserPlus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

// Definiujemy typ dla wpisu z feedu
interface ActivityEvent {
    event_type: 'time_entry' | 'audit' | 'user_created'; // Dodamy 'user_created' w przyszłości
    event_timestamp: string;
    user_id: string;
    user_name: string;
    details: any; // Typ JSONB
}

// Komponent pomocniczy do renderowania różnych typów zdarzeń
function ActivityEventItem({ event }: { event: ActivityEvent }) {
    const timeAgo = formatDistanceToNow(new Date(event.event_timestamp), { addSuffix: true, locale: pl });

    let Icon = LogIn;
    let title = '';
    let description = '';

    if (event.event_type === 'time_entry') {
        if (event.details.status === 'clock_in' || event.details.status === 'job_change') {
            Icon = LogIn;
            title = `${event.user_name} rozpoczął pracę`;
            description = `Zlecenie: ${event.details.task_name || 'Ogólne'} (${event.details.project_name || '-'})`;
        } else {
            Icon = LogOut;
            title = `${event.user_name} zakończył pracę`;
            description = `Zlecenie: ${event.details.task_name || 'Ogólne'} (${event.details.project_name || '-'})`;
        }
    } else if (event.event_type === 'audit') {
        if (event.details.new_values?.status === 'DELETED') {
            Icon = Trash2;
            title = `${event.user_name} usunął wpis`;
            description = `Powód: ${event.details.change_reason || '-'}`;
        } else {
            Icon = Edit;
            title = `${event.user_name} edytował wpis`;
            description = `Powód: ${event.details.change_reason || '-'}`;
        }
    } else {
        Icon = UserPlus; // Na przyszłość
        title = `Zdarzenie: ${event.event_type}`;
    }

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

    return (
        <li className="flex items-center gap-4">
            <Avatar className="h-9 w-9">
                <AvatarFallback>
                    <Icon className="h-4 w-4" />
                </AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <time className="text-sm text-muted-foreground self-start">{timeAgo}</time>
        </li>
    );
}

// Główny komponent feedu
export function ActivityFeed() {
    const [events, setEvents] = useState<ActivityEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchActivity = async () => {
        try {
            const response = await api.get('/activity/feed');
            setEvents(response.data);
        } catch (error) {
            toast.error('Błąd', { description: 'Nie udało się pobrać aktywności.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity();
        // Ustawiamy automatyczne odświeżanie co 30 sekund
        const interval = setInterval(fetchActivity, 30000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return <p className="text-center text-muted-foreground">Ładowanie aktywności...</p>;
    }

    return (
        <Card>
            <CardContent className="p-6">
                <ul className="space-y-6">
                    {events.length > 0 ? (
                        events.map((event, index) => (
                            <ActivityEventItem key={`${event.event_timestamp}-${index}`} event={event} />
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground">Brak aktywności do wyświetlenia.</p>
                    )}
                </ul>
            </CardContent>
        </Card>
    );
}