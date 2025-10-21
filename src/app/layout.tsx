import './globals.css';
import { Toaster } from '@/components/ui/sonner'; // Możemy przenieść Toaster tutaj

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
        {children}
        <Toaster richColors />
        </body>
        </html>
    );
}