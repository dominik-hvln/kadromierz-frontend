'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AuthBrandHeader from '@/components/layout/AuthBrandHeader';
import Link from 'next/link';

type ViewState = 'loading' | 'ok' | 'error';

export default function ConfirmEmailPage() {
    const [state, setState] = useState<ViewState>('loading');
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        // Czytamy query bez useSearchParams (żeby uniknąć Suspense warningu)
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const params = new URLSearchParams(search);

        const errorDesc = params.get('error_description');
        const code = params.get('code');

        if (errorDesc) {
            setState('error');
            setMessage(errorDesc);
            return;
        }

        // Supabase: czasem używa ?code=..., starsze linki mogą mieć #access_token w hashu
        if (code || hash.includes('access_token')) {
            setState('ok');
        } else {
            setState('error');
            setMessage('Brak kodu potwierdzającego.');
        }
    }, []);

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
                    <AuthBrandHeader
                        title="Konto aktywne 🎉"
                        description="Możesz przejść do logowania."
                    />
                    <CardContent className="space-y-3">
                        <Button asChild className="w-full">
                            <Link href="/">Przejdź do logowania</Link>
                        </Button>
                        {/* Jeśli chcesz od razu wpuszczać do aplikacji:
            <Button asChild variant="secondary" className="w-full">
              <Link href="/dashboard">Przejdź do aplikacji</Link>
            </Button> */}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // state === 'error'
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-sm">
                <AuthBrandHeader
                    title="Nie udało się"
                    description={message || 'Token jest nieprawidłowy albo wygasł.'}
                />
                <CardContent className="space-y-3">
                    <Button asChild variant="secondary" className="w-full">
                        <Link href="/">Wróć do logowania</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
