'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function RegulaminPage() {
    const router = useRouter();

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-4xl glassmorphism-box">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-2xl">Regulamin korzystania z systemu Effixy</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                    <p>
                        1. Informacje ogólne
                        Niniejszy Regulamin określa zasady korzystania z systemu Effixy – aplikacji webowej i mobilnej
                        typu SaaS służącej do ewidencji i rozliczania czasu pracy oraz powiązanych procesów kadrowych
                        w firmach (B2B).
                        Właścicielem i operatorem systemu jest: Appity Mikołaj Lubawy ul. Ogrodnicza 13 62-006
                        Janikowo, NIP 7781463016, REGON 540670410 zwany dalej „Usługodawca”.
                        Klientem systemu jest przedsiębiorca (firma), który udostępnia Effixy swoim pracownikom lub
                        współpracownikom w celu rejestrowania czasu pracy i korzystania z funkcji systemu, dalej: „Klient”.
                        2. Definicje
                        • Effixy / System – aplikacja webowa i mobilna udostępniana w modelu SaaS.
                        • Klient – podmiot gospodarczy (B2B), który zawiera umowę subskrypcyjną i zarządza
                        dostępami.
                        • Użytkownik – osoba fizyczna (np. pracownik Klienta) korzystająca z Systemu na podstawie
                        uprawnień nadanych przez Klienta.
                        • Konto – konto Klienta lub Użytkownika w Systemie.
                        • Subskrypcja / Abonament – odpłatny dostęp do Systemu na czas określony (miesiąc/rok)
                        zgodnie z wybranym planem.
                        • Zasoby – zawartość i funkcjonalności serwisu (Systemu) dostępne pod adresem:
                        3. Zakres usług
                        System Effixy umożliwia w szczególności:
                        • rejestrację czasu pracy (start/stop), w tym w terenie i w biurze,
                        • rejestrację lokalizacji (np. geofencing) – jeśli Klient włączy taką funkcję,
                        • rejestrację zdarzeń w oparciu o aplikację mobilną i kody QR,
                        • zarządzanie zleceniami i zadaniami,
                        • obsługę urlopów, nieobecności, nadgodzin (zgłoszenia/akceptacje), [w trakcie wdrożenia]
                        • generowanie raportów i dokumentów oraz eksport danych (np. CSV, XLS, PDF, JSON).
                        Zakres funkcjonalności może zależeć od wybranego planu subskrypcyjnego oraz ustawień Klienta.
                        4. Wymagania techniczne i przerwy
                        1. Do korzystania z Zasobów na urządzeniach końcowych typu komputer, tablet, smartfon
                        niezbędne jest:
                        a) podłączenie urządzenia końcowego do sieci internet,
                        b) aktywne konto poczty elektronicznej (e-mail),
                        c) posiadanie i korzystanie z systemu operacyjnego oraz oprogramowania w wersji nie starszej niż:
                        - Microsoft Windows 7 lub nowszy,
                        - Mac OS X 10.7 lub nowszy,
                        - Android 5.1 lub nowszy,
                        - iOS 9.3 lub nowszy,
                        - przeglądarka internetowa obsługująca standard HTML5 oraz JavaScript (np. Internet Explorer,
                        Google Chrome, Mozilla Firefox, Opera, Safari),
                        - włączenie obsługi plików cookies.
                        2. Usługodawca zastrzega sobie prawo do przerw technicznych w dostępie do Zasobów w celu
                        rozbudowy, wykonania prac modernizacyjnych lub przeglądów konserwacyjnych urządzeń
                        odpowiedzialnych za dostarczanie usług, a także przerw spowodowanych siłą wyższą.
                        3. Majątkowe prawa autorskie do Zasobów należą do Usługodawcy i podlegają ochronie
                        przewidzianej w ustawie z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych.
                        4. Żadna część, jak i całość Zasobów nie może być powielana i rozpowszechniana w jakiejkolwiek
                        formie bez uprzedniej pisemnej zgody Usługodawcy.
                        5. Użytkownik nie może udostępniać swojego hasła lub innych danych uwierzytelniających w celu
                        umożliwienia osobom trzecim uzyskania dostępu do Zasobów.
                        6. Usługodawca nie ponosi odpowiedzialności:
                        - za utrudnienia w dostępie do Zasobów wynikające z przyczyn leżących po stronie Użytkownika,
                        - z tytułu szkód spowodowanych działaniami lub zaniechaniami Użytkowników, w szczególności za
                        korzystanie przez nich z Zasobów w sposób niezgodny z prawem lub Regulaminem,
                        - za blokowanie przez administratorów serwerów pocztowych przesyłania wiadomości na adres e-
                        mail wskazany przez Użytkownika oraz za usuwanie i blokowanie wiadomości e-mail przez
                        oprogramowanie zainstalowane na urządzeniu końcowym Użytkownika,
                        - za nieprawidłowe funkcjonowanie Zasobów spowodowane:
                        * działaniem siły wyższej,
                        * jakością łącza (połączenia) Użytkownika z siecią internet,
                        * Awariami urządzeń dostawców internetu Użytkownika,
                        * awarią powstałą z winy Użytkownika lub nieprawidłowościami w systemie/systemach
                        zainstalowanych na urządzeniu końcowym Użytkownika,
                        * jakąkolwiek szkodę wyrządzoną zastosowaniem lub brakiem zastosowania się do informacji
                        zawartych w Zasobach.
                        5. Zawarcie umowy i dostęp do Systemu
                        Umowa o świadczenie usług drogą elektroniczną zostaje zawarta z chwilą rejestracji Konta Klienta
                        oraz akceptacji Regulaminu i opłacenia Subskrypcji (o ile nie uzgodniono okresu próbnego).
                        Klient jest odpowiedzialny za tworzenie kont Użytkowników, nadawanie ról i uprawnień oraz
                        aktualność danych wprowadzanych do Systemu.
                        Użytkownicy logują się do Systemu w celu rozpoczęcia i zakończenia czasu pracy oraz korzystania
                        z innych funkcji udostępnionych przez Klienta (np. raporty, urlopy).
                        6. Subskrypcja i płatności
                        Korzystanie z Effixy odbywa się wyłącznie w modelu subskrypcyjnym. Brak jest jednorazowych
                        opłat licencyjnych.
                        Opłaty za Subskrypcję są naliczane z góry za wybrany okres rozliczeniowy (miesiąc/rok) zgodnie z
                        cennikiem obowiązującym w dniu zawarcia lub odnowienia Subskrypcji.
                        W przypadku braku płatności Usługodawca może ograniczyć funkcjonalności lub czasowo
                        zablokować dostęp do Systemu do czasu uregulowania należności.
                        7. Obowiązki Klienta i Użytkowników
                        Klient zobowiązuje się korzystać z Systemu zgodnie z prawem, Regulaminem oraz
                        przeznaczeniem usługi.
                        Klient odpowiada za poinformowanie pracowników o zasadach przetwarzania danych oraz
                        zapewnienie podstawy prawnej przetwarzania danych osobowych (w tym danych lokalizacyjnych,
                        jeżeli są przetwarzane).
                        Użytkownik zobowiązuje się do rzetelnego rejestrowania czasu pracy oraz nieudostępniania
                        danych dostępowych osobom trzecim.
                        8. Odpowiedzialność
                        Usługodawca dokłada należytej staranności, aby zapewnić prawidłowe działanie Systemu.
                        Usługodawca nie odpowiada za sposób wykorzystania Systemu przez Klienta, w szczególności za
                        decyzje kadrowe i rozliczeniowe podejmowane na podstawie danych z Systemu.
                        Klient ponosi odpowiedzialność za działania Użytkowników w Systemie oraz za treści i dane
                        wprowadzane do Systemu.
                        9. Reklamacje i wsparcie
                        Zgłoszenia dotyczące działania Systemu oraz reklamacje należy kierować na adres e-mail:
                        [kontakt@effixy.pl].
                        Usługodawca udzieli odpowiedzi na reklamację w terminie 14 dni roboczych od jej otrzymania, o ile
                        przepisy bezwzględnie obowiązujące nie stanowią inaczej.
                        10. Wypowiedzenie i zakończenie korzystania
                        Klient może zrezygnować z Subskrypcji w dowolnym momencie. Umowa wygasa z końcem
                        opłaconego okresu rozliczeniowego.
                        Po zakończeniu Subskrypcji Klient może wyeksportować dane. Dane zostaną następnie usunięte
                        po upływie okresu retencji wskazanego w umowie lub polityce (np. 30 dni), chyba że prawo
                        wymaga dłuższego przechowywania.
                        11. Postanowienia końcowe
                        Regulamin podlega prawu polskiemu. W sprawach nieuregulowanych zastosowanie mają
                        właściwe przepisy prawa.
                        Usługodawca zastrzega sobie prawo do zmiany Regulaminu z ważnych przyczyn technicznych,
                        prawnych lub organizacyjnych. Zmiana Regulaminu staje się skuteczna w terminie wskazanym
                        przez Usługodawcę, nie krótszym niż 7 dni od momentu udostępnienia na stronie domowej
                        serwisu.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
