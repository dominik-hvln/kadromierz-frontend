'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CURRENT_TERMS_DATE, CURRENT_TERMS_VERSION } from '@/lib/terms';

export default function RegulaminPage() {
    const router = useRouter();

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-4xl glassmorphism-box">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <CardTitle className="text-2xl">Regulamin korzystania z systemu Effixy</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            Wersja {CURRENT_TERMS_VERSION} · obowiązuje od {CURRENT_TERMS_DATE}
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="legal-prose max-w-none">
                    <h2>1. Informacje ogólne</h2>
                    <p>
                        Niniejszy Regulamin określa zasady korzystania z systemu Effixy – aplikacji webowej i mobilnej
                        typu SaaS służącej do ewidencji i rozliczania czasu pracy oraz powiązanych procesów kadrowych
                        w firmach (B2B).
                    </p>
                    <p>
                        Właścicielem i operatorem systemu jest: <strong>Appity Mikołaj Lubawy</strong>, ul. Ogrodnicza 13,
                        62-006 Janikowo, NIP 7781463016, REGON 540670410, zwany dalej „Usługodawcą”.
                    </p>
                    <p>
                        Klientem systemu jest przedsiębiorca (firma), który udostępnia Effixy swoim pracownikom lub
                        współpracownikom w celu rejestrowania czasu pracy i korzystania z funkcji systemu, dalej: „Klient”.
                    </p>

                    <h2>2. Definicje</h2>
                    <ul>
                        <li><strong>Effixy / System</strong> – aplikacja webowa i mobilna udostępniana w modelu SaaS.</li>
                        <li><strong>Klient</strong> – podmiot gospodarczy (B2B), który zawiera umowę subskrypcyjną i zarządza dostępami.</li>
                        <li><strong>Użytkownik</strong> – osoba fizyczna (np. pracownik Klienta) korzystająca z Systemu na podstawie uprawnień nadanych przez Klienta.</li>
                        <li><strong>Konto</strong> – konto Klienta lub Użytkownika w Systemie.</li>
                        <li><strong>Subskrypcja / Abonament</strong> – odpłatny dostęp do Systemu na czas określony (miesiąc/rok) zgodnie z wybranym planem.</li>
                        <li>
                            <strong>Zasoby</strong> – zawartość i funkcjonalności serwisu (Systemu) dostępne pod adresem:{' '}
                            <a href="https://app.effixy.pl" target="_blank" rel="noopener noreferrer">https://app.effixy.pl</a>.
                        </li>
                    </ul>

                    <h2>3. Zakres usług</h2>
                    <p>System Effixy umożliwia w szczególności:</p>
                    <ul>
                        <li>rejestrację czasu pracy (start/stop), w tym w terenie i w biurze,</li>
                        <li>rejestrację lokalizacji (np. geofencing) – jeśli Klient włączy taką funkcję,</li>
                        <li>rejestrację zdarzeń w oparciu o aplikację mobilną i kody QR,</li>
                        <li>zarządzanie zleceniami i zadaniami,</li>
                        <li>obsługę urlopów, nieobecności, nadgodzin (zgłoszenia/akceptacje), <em>[w trakcie wdrożenia]</em></li>
                        <li>generowanie raportów i dokumentów oraz eksport danych (np. CSV, XLS, PDF, JSON).</li>
                    </ul>
                    <p>Zakres funkcjonalności może zależeć od wybranego planu subskrypcyjnego oraz ustawień Klienta.</p>

                    <h2>4. Wymagania techniczne i przerwy</h2>
                    <p>
                        1. Do korzystania z Zasobów na urządzeniach końcowych typu komputer, tablet, smartfon,
                        niezbędne jest:
                    </p>
                    <ol className="list-alpha">
                        <li>podłączenie urządzenia końcowego do sieci internet,</li>
                        <li>aktywne konto poczty elektronicznej (e-mail),</li>
                        <li>
                            posiadanie i korzystanie z systemu operacyjnego oraz oprogramowania w wersji nie starszej niż:
                            <ul>
                                <li>Microsoft Windows 7 lub nowszy,</li>
                                <li>Mac OS X 10.7 lub nowszy,</li>
                                <li>Android 5.1 lub nowszy,</li>
                                <li>iOS 9.3 lub nowszy,</li>
                                <li>
                                    przeglądarka internetowa obsługująca standard HTML5 oraz JavaScript
                                    (np. Internet Explorer, Google Chrome, Mozilla Firefox, Opera, Safari),
                                </li>
                                <li>włączenie obsługi plików cookies.</li>
                            </ul>
                        </li>
                    </ol>
                    <p>
                        2. Usługodawca zastrzega sobie prawo do przerw technicznych w dostępie do Zasobów w celu
                        rozbudowy, wykonania prac modernizacyjnych lub przeglądów konserwacyjnych urządzeń
                        odpowiedzialnych za dostarczanie usług, a także spowodowanych siłą wyższą.
                    </p>
                    <p>
                        3. Majątkowe prawa autorskie do Zasobów należą do Usługodawcy i podlegają ochronie przewidzianej
                        w ustawie z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych.
                    </p>
                    <p>
                        4. Żadna część, jak i całość Zasobów nie może być powielana i rozpowszechniana w jakiejkolwiek
                        formie bez uprzedniej pisemnej zgody Usługodawcy.
                    </p>
                    <p>
                        5. Użytkownik nie może udostępniać swojego hasła lub innych danych uwierzytelniających w celu
                        umożliwienia osobom trzecim uzyskania dostępu do Zasobów.
                    </p>
                    <p>6. Usługodawca nie ponosi odpowiedzialności:</p>
                    <ul>
                        <li>za utrudnienia w dostępie do Zasobów wynikające z przyczyn leżących po stronie Użytkownika,</li>
                        <li>
                            z tytułu szkód spowodowanych działaniami lub zaniechaniami Użytkowników, w szczególności
                            za korzystanie przez nich z Zasobów w sposób niezgodny z prawem lub Regulaminem,
                        </li>
                        <li>
                            za blokowanie przez administratorów serwerów pocztowych przesyłania wiadomości na adres
                            e-mail wskazany przez Użytkownika oraz za usuwanie i blokowanie wiadomości e-mail przez
                            oprogramowanie zainstalowane na urządzeniu końcowym Użytkownika,
                        </li>
                        <li>
                            za nieprawidłowe funkcjonowanie Zasobów spowodowane: działaniem siły wyższej; jakością łącza
                            (połączenia) Użytkownika z siecią internet; awariami urządzeń dostawców internetu Użytkownika;
                            awarią powstałą z winy Użytkownika lub nieprawidłowościami w systemie/systemach
                            zainstalowanych na urządzeniu końcowym Użytkownika; jakąkolwiek szkodę wyrządzoną
                            zastosowaniem lub brakiem zastosowania się do informacji zawartych w Zasobach.
                        </li>
                    </ul>

                    <h2>5. Zawarcie umowy i dostęp do Systemu</h2>
                    <p>
                        Umowa o świadczenie usług drogą elektroniczną zostaje zawarta z chwilą rejestracji Konta Klienta
                        oraz akceptacji Regulaminu i opłacenia Subskrypcji (o ile nie uzgodniono okresu próbnego).
                    </p>
                    <p>
                        Klient jest odpowiedzialny za tworzenie kont Użytkowników, nadawanie ról i uprawnień oraz
                        aktualność danych wprowadzanych do Systemu.
                    </p>
                    <p>
                        Użytkownicy logują się do Systemu w celu rozpoczęcia i zakończenia czasu pracy oraz korzystania
                        z innych funkcji udostępnionych przez Klienta (np. raporty, urlopy).
                    </p>

                    <h2>6. Subskrypcja i płatności</h2>
                    <p>
                        Korzystanie z Effixy odbywa się wyłącznie w modelu subskrypcyjnym. Brak jest jednorazowych
                        opłat licencyjnych.
                    </p>
                    <p>
                        Opłaty za Subskrypcję są naliczane z góry za wybrany okres rozliczeniowy (miesiąc/rok) zgodnie
                        z cennikiem obowiązującym w dniu zawarcia lub odnowienia Subskrypcji.
                    </p>
                    <p>
                        W przypadku braku płatności Usługodawca może ograniczyć funkcjonalności lub czasowo zablokować
                        dostęp do Systemu do czasu uregulowania należności.
                    </p>
                    <p>
                        Wszystkie prace dodatkowe takie jak: szkolenia, konsultacje, modyfikacje systemu, rozbudowanie
                        o dedykowane funkcjonalności będą wyceniane indywidualnie po dokonaniu zgłoszenia na adres{' '}
                        <strong>kontakt@effixy.pl</strong>.
                    </p>

                    <h2>7. Obowiązki Klienta i Użytkowników</h2>
                    <p>
                        Klient zobowiązuje się korzystać z Systemu zgodnie z prawem, Regulaminem oraz przeznaczeniem usługi.
                    </p>
                    <p>
                        Klient odpowiada za poinformowanie pracowników o zasadach przetwarzania danych oraz zapewnienie
                        podstawy prawnej przetwarzania danych osobowych (w tym danych lokalizacyjnych, jeżeli są przetwarzane).
                    </p>
                    <p>
                        Użytkownik zobowiązuje się do rzetelnego rejestrowania czasu pracy oraz nieudostępniania danych
                        dostępowych osobom trzecim.
                    </p>

                    <h2>8. Odpowiedzialność</h2>
                    <p>Usługodawca dokłada należytej staranności, aby zapewnić prawidłowe działanie Systemu.</p>
                    <p>
                        Usługodawca nie odpowiada za sposób wykorzystania Systemu przez Klienta, w szczególności za
                        decyzje kadrowe i rozliczeniowe podejmowane na podstawie danych z Systemu.
                    </p>
                    <p>
                        Klient ponosi odpowiedzialność za działania Użytkowników w Systemie oraz za treści i dane
                        wprowadzane do Systemu.
                    </p>

                    <h2>9. Reklamacje i wsparcie</h2>
                    <p>
                        Zgłoszenia dotyczące działania Systemu oraz reklamacje należy kierować na adres e-mail:{' '}
                        <strong>kontakt@effixy.pl</strong>.
                    </p>
                    <p>
                        Usługodawca udzieli odpowiedzi na reklamację w terminie 14 dni roboczych od jej otrzymania,
                        o ile przepisy bezwzględnie obowiązujące nie stanowią inaczej.
                    </p>

                    <h2>10. Wypowiedzenie i zakończenie korzystania</h2>
                    <p>
                        Klient może zrezygnować z Subskrypcji w dowolnym momencie. Umowa wygasa z końcem opłaconego
                        okresu rozliczeniowego.
                    </p>
                    <p>
                        Po zakończeniu Subskrypcji Klient może wyeksportować dane. Dane zostaną następnie usunięte
                        po upływie okresu retencji wskazanego w umowie lub polityce (np. 30 dni), chyba że prawo
                        wymaga dłuższego przechowywania.
                    </p>

                    <h2>11. Postanowienia końcowe</h2>
                    <p>
                        Regulamin podlega prawu polskiemu. W sprawach nieuregulowanych zastosowanie mają właściwe
                        przepisy prawa.
                    </p>
                    <p>
                        Usługodawca zastrzega sobie prawo do zmiany Regulaminu z ważnych przyczyn technicznych,
                        prawnych lub organizacyjnych. Zmiana Regulaminu staje się skuteczna w terminie wskazanym
                        przez Usługodawcę, nie krótszym niż 7 dni od momentu udostępnienia na stronie domowej serwisu.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
