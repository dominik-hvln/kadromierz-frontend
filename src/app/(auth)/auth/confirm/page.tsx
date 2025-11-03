'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

// Klient Supabase po stronie przeglądarki (publiczny anon key)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type ViewState = 'loading' | 'ok' | 'error';

export default function ConfirmEmailPage() {
    const search = useSearchParams();
    const code = search.get('code'); // Supabase v2 zwykle przekazuje ?code=...
    const errorDesc = search.get('error_description');
    const [state, setState] = useState<ViewState>('loading');
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        (async () => {
            // Jeśli Supabase przysłał błąd w query
            if (errorDesc) {
                setState('error');
                setMessage(errorDesc);
                return;
            }

            // Brak ?code — sprawdź fallback przez hash (starsze linki)
            if (!code) {
                const hash = typeof window !== 'undefined' ? window.location.hash : '';
                if (hash.includes('access_token')) {
                    // e-mail już potwierdzony po stronie Supabase, sesja ustawiona przez hash
                    setState('ok');
                    return;
                }
                setState('error');
                setMessage('Brak kodu potwierdzającego.');
                return;
            }

            // Zamień code -> sesja (ustawia sesję po stronie klienta)
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
                setState('error');
                setMessage(error.message || 'Nie udało się aktywować konta.');
                return;
            }
            setState('ok');
        })();
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
                        <CardDescription>Możesz przejść do logowania.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button asChild className="w-full">
                            <Link href="/">Przejdź do logowania</Link>
                        </Button>
                        {/* Jeśli wolisz od razu wpuszczać do aplikacji, możesz dodać:
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
