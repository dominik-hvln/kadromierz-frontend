'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ConfirmEmailPage() {
    const search = useSearchParams();
    const router = useRouter();
    const token = search.get('token') || '';
    const [state, setState] = useState<'loading'|'ok'|'error'>('loading');
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        (async () => {
            if (!token) {
                setState('error');
                setMessage('Brak tokenu.');
                return;
            }
            try {
                await api.post('/auth/confirm', { token });
                setState('ok');
            } catch (e: any) {
                setState('error');
                setMessage(e?.response?.data?.message || 'Nie udało się potwierdzić adresu e-mail.');
            }
        })();
    }, [token]);

    if (state === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Aktywuję konto…</p>
            </div>
        );
    }

    if (state === 'ok') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Konto aktywne 🎉</CardTitle>
                        <CardDescription>Możesz się teraz zalogować.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/">Przejdź do logowania</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Nie udało się</CardTitle>
                    <CardDescription>{message || 'Token jest nieprawidłowy albo wygasł.'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button asChild variant="secondary" className="w-full">
                        <Link href="/">Wróć do logowania</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
