'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

type ViewState = 'loading' | 'ok' | 'error';

export default function ConfirmEmailPage() {
    const search = useSearchParams();
    const errorDesc = search.get('error_description');
    const code = search.get('code'); // Supabase zwykle dodaje ?code=...
    const [state, setState] = useState<ViewState>('loading');
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        // Jeżeli Supabase przekazał opis błędu w query → pokaż go
        if (errorDesc) {
            setState('error');
            setMessage(errorDesc);
            return;
        }

        // Jeśli jest ?code albo w hash jest access_token (starsze linki) → OK
        const hasHashAccess =
            typeof window !== 'undefined' && window.location.hash.includes('access_token');

        if (code || hasHashAccess) {
            setState('ok');
        } else {
            setState('error');
            setMessage('Brak kodu potwierdzającego.');
        }
    }, [code, errorDesc]);

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
                    <CardContent className="space-y-3">
                        <Button asChild className="w-full">
                            <Link href="/">Przejdź do logowania</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // state === 'error'
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
