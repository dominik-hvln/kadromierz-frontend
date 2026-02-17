'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function PolitykaPrywatnosciPage() {
    const router = useRouter();

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-4xl glassmorphism-box">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-2xl">Polityka prywatności (RODO) systemu Effixy</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground italic mb-4">
                        model: Klient jako Administrator danych, Effixy jako Podmiot Przetwarzający
                        1. Role w przetwarzaniu danych
                        W zakresie danych osobowych pracowników i innych Użytkowników wprowadzanych do Systemu,
                        Klient (firma) jest Administratorem danych osobowych, a Usługodawca (Effixy) działa jako Podmiot
                        Przetwarzający (procesor) na podstawie art. 28 RODO.
                        W zakresie danych kontaktowych osób reprezentujących Klienta (np. administrator konta, osoba
                        do kontaktu) Usługodawca może występować jako Administrator danych.
                        2. Jakie dane mogą być przetwarzane w Systemie
                        W zależności od konfiguracji Klienta, w Systemie mogą być przetwarzane m.in.:
                        • dane identyfikacyjne Użytkownika (np. imię, nazwisko, identyfikator pracowniczy, e-mail
                        służbowy),
                        • dane ewidencji czasu pracy (start/stop, przerwy, nadgodziny, grafiki),
                        • dane o nieobecnościach i urlopach (wnioski, status akceptacji),
                        • dane lokalizacyjne związane z rejestracją czasu pracy (jeśli funkcja włączona),
                        • dane techniczne (np. logi dostępu, identyfikatory sesji) w zakresie niezbędnym dla
                        bezpieczeństwa i działania usługi.
                        3. Cele przetwarzania
                        Dane są przetwarzane w szczególności w celu:
                        • świadczenia usługi Effixy na rzecz Klienta (ewidencja i rozliczanie czasu pracy, obsługa
                        urlopów i raportów),
                        • zapewnienia bezpieczeństwa Systemu oraz zapobiegania nadużyciom,
                        • obsługi zgłoszeń i wsparcia technicznego,
                        • rozliczeń i fakturowania (dane Klienta / osoby kontaktowej).
                        4. Podstawa prawna i odpowiedzialność Klienta
                        Klient jako Administrator danych odpowiada za zapewnienie podstawy prawnej przetwarzania
                        danych Użytkowników, spełnienie obowiązku informacyjnego oraz realizację praw osób, których
                        dane dotyczą.
                        Usługodawca przetwarza dane wyłącznie na polecenie Klienta, w zakresie niezbędnym do
                        świadczenia usługi, zgodnie z umową powierzenia przetwarzania danych.
                        5. Odbiorcy danych i podwykonawcy
                        Dane mogą być powierzane podwykonawcom Usługodawcy wyłącznie w zakresie niezbędnym do
                        świadczenia usługi (np. dostawcy hostingu, infrastruktury, usług e-mail), na podstawie
                        odpowiednich umów powierzenia.
                        Dane nie są sprzedawane ani wykorzystywane do celów marketingowych w odniesieniu do
                        Użytkowników Klienta.
                        6. Bezpieczeństwo
                        Usługodawca stosuje adekwatne środki techniczne i organizacyjne, w tym m.in. szyfrowanie
                        transmisji, kontrolę dostępu, kopie zapasowe oraz monitoring bezpieczeństwa, aby chronić dane
                        przed nieuprawnionym dostępem, utratą lub modyfikacją.
                        7. Okres przechowywania danych
                        Dane Użytkowników są przechowywane przez czas trwania umowy z Klientem. Po zakończeniu
                        umowy dane mogą zostać udostępnione Klientowi do eksportu, a następnie usunięte po okresie
                        retencji (np. 30 dni), chyba że prawo wymaga dłuższego przechowywania.
                        Dane rozliczeniowe (np. faktury) przechowywane są przez okres wymagany przepisami
                        podatkowymi i rachunkowymi.
                        8. Prawa osób, których dane dotyczą
                        Wnioski Użytkowników dotyczące realizacji praw wynikających z RODO (np. dostęp, sprostowanie,
                        ograniczenie) powinny być kierowane do Klienta jako Administratora danych. Usługodawca
                        wspiera Klienta w realizacji tych praw w zakresie wymaganym przez RODO i umowę powierzenia.
                        9. Kontakt
                        Kontakt w sprawach związanych z usługą i danymi osobowymi: [rodo@effixy.pl] /
                        [kontakt@effixy.pl].
                        W przypadku zapytań Użytkowników zalecany jest również kontakt z administratorem po stronie
                        Klienta (dział HR / administrator konta).
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
