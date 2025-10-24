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
        <body className="relative"> {/* Ustawia kontekst dla z-index */}

        {/* WARSTWA 1: TŁO APLIKACJI */}
        {/* Ten div ma nasze tło i jest na samym spodzie (-z-20) */}
        <div className="fixed inset-0 -z-20 bg-background" />

        {/* WARSTWA 2: EFEKT "GLOW" */}
        {/* Ten div jest nad tłem, ale pod treścią (-z-10) */}
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-10"
        >
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
                    opacity: 0.7,
                }}
            />
        </div>

        {/* WARSTWA 3: TREŚĆ APLIKACJI */}
        {/* {children} jest na domyślnym z-index: 0, więc jest na wierzchu */}
        {children}

        <Toaster richColors />
        </body>
        </html>
    );
}