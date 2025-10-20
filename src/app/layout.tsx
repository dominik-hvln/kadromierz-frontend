// src/app/layout.tsx
import './globals.css'; // Zachowujemy tylko globalne style

export const metadata = {
    title: 'Aplikacja Czasu Pracy',
    description: 'Logowanie',
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
        {/* Celowo usuwamy wszystko inne, np. import czcionek */}
        </body>
        </html>
    );
}