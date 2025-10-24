import './globals.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata = {
    title: 'Aplikacja Czasu Pracy',
    description: 'Zarządzanie czasem pracy w terenie',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pl">
        <body>

        {/* WARSTWA 1: TŁO (z-index: -20) */}
        {/* Ten div jest na samym spodzie i ma nasz globalny, szary kolor tła. */}
        <div className="fixed inset-0 -z-20 bg-background" />

        {/* WARSTWA 3: TREŚĆ APLIKACJI (z-index: 0, domyślnie) */}
        {/* {children} renderuje się na wierzchu, a nasze
            komponenty .glassmorphism-box będą teraz poprawnie
            rozmazywać WARSTWĘ 2 (blask). */}
        {children}

        <Toaster richColors />
        </body>
        </html>
    );
}