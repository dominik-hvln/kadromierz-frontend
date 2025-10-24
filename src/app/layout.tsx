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

        {/* WARSTWA 2: EFEKT "GLOW" (z-index: -10) */}
        {/* Ten div jest NAD tłem, ale POD treścią. */}
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-10"
        >
            <div
                className="absolute bottom-[-30vh] left-0 right-0 h-[60vh] w-full"
                style={{
                    backgroundImage: `radial-gradient(
                ellipse at 50% 100%,
                oklch(0.85 0.05 240 / 0.85), /* Delikatny niebieski */
                oklch(0.9 0.1 160 / 0.45),  /* Delikatny zielony */
                transparent 70%
              )`,
                    filter: 'blur(120px)',
                    opacity: 1,
                }}
            />
        </div>

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