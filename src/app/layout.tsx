// src/app/layout.tsx
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
        {/* Dodajemy 'relative', aby element glow pozycjonował się względem body */}
        <body className="relative">
        {/* Główna treść aplikacji */}
        <div className="relative z-10"> {/* Umieszczamy treść na warstwie z-index: 10 */}
            {children}
        </div>

        <Toaster richColors />

        {/* ✅ ELEMENT "GLOW" */}
        <div
            aria-hidden="true" // Ukryte przed czytnikami ekranu
            className="pointer-events-none fixed inset-0 -z-10" // Umieszczamy go z tyłu
        >
            {/* Definicja gradientu */}
            <div
                className="absolute bottom-[-30vh] left-0 right-0 h-[60vh] w-full"
                style={{
                    backgroundImage: `radial-gradient(
                ellipse at 50% 100%,
                oklch(0.85 0.05 240 / 0.25), /* Delikatny niebieski */
                oklch(0.9 0.1 160 / 0.15),  /* Delikatny zielony */
                transparent 70%
              )`,
                    filter: 'blur(120px)',
                    opacity: 0.7, // Możemy kontrolować moc blasku
                }}
            />
        </div>
        </body>
        </html>
    );
}