'use client'; // Musimy dodać 'use client' ze względu na useEffect

import Image from "next/image";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();

    // Przekierowanie po stronie klienta
    useEffect(() => {
        // Ważne: Przekierowujemy do '/login', a nie '/app/(auth)/login'
        // Grupa (auth) nie jest częścią adresu URL
        router.replace('/login');
    }, [router]);

    // Zwracamy treść strony (może być widoczna przez ułamek sekundy)
    return (
        <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
            <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
                <Image
                    className="dark:invert"
                    src="/next.svg" // Upewnij się, że masz te pliki w folderze /public
                    alt="Next.js logo"
                    width={180}
                    height={38}
                    priority
                />
                {/* Możesz usunąć resztę treści Vercel, jeśli chcesz */}
                <p>Przekierowywanie do strony logowania...</p>
            </main>
            <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
                {/* Możesz zostawić lub usunąć stopkę */}
            </footer>
        </div>
    );
}