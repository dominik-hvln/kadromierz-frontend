// src/app/(auth)/auth/confirm/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";

// Ta strona jest bardzo prosta. Supabase wykonało już aktywację w tle,
// zanim użytkownik tu trafił. My tylko wyświetlamy komunikat.

export default function AuthConfirmPage() {
    const [message, setMessage] = useState("Potwierdzanie konta...");

    useEffect(() => {
        // Dajemy chwilę na ewentualne przetworzenie
        const timer = setTimeout(() => {
            setMessage("Konto zostało pomyślnie aktywowane!");
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{message}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground">
                        Możesz się teraz zalogować na swoje konto.
                    </p>
                    <Button asChild className="w-full mt-6">
                        <Link href="/">Przejdź do logowania</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}