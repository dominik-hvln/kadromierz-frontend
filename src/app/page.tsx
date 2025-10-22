'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Fingerprint } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

// ✅ Importujemy oba pluginy
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Preferences } from '@capacitor/preferences';

// ✅ Definiujemy klucze do zapisu w Preferences (jak w zozoapp)
const BIO_AUTH_EMAIL_KEY = 'bio_auth_email';
const BIO_AUTH_PASSWORD_KEY = 'bio_auth_password';

export default function LoginPage() {
    const router = useRouter();
    const { setSession, isAuthenticated, isHydrating } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [canUseBiometrics, setCanUseBiometrics] = useState(false);
    const [isNative, setIsNative] = useState(false);

    // Sprawdza dostępność biometrii i czy sesja już istnieje
    useEffect(() => {
        const checkPlatform = async () => {
            const native = Capacitor.isNativePlatform();
            setIsNative(native);
            if (native) {
                const { isAvailable } = await NativeBiometric.isAvailable();
                setCanUseBiometrics(isAvailable);
            }
        };

        if (isHydrating) return; // Czekamy na wczytanie sesji z Zustand
        if (isAuthenticated) {
            router.push('/dashboard/entries'); // Jeśli sesja już jest, przekieruj
            return;
        }

        checkPlatform();
    }, [isHydrating, isAuthenticated, router]); // Dodano zależności

    // Funkcja logowania hasłem (z logiką zapisu do Preferences)
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', {
                email,
                password,
            });

            const { session, profile } = response.data;
            setSession(session.access_token, profile); // Zapisuje sesję w Zustand (i Preferences)

            // ✅ Logika "Zapytaj o zapis biometrii" (jak w zozoapp)
            if (isNative && canUseBiometrics) {
                const wantsSave = window.confirm("Czy chcesz zapisać te dane logowania, aby używać biometrii do autouzupełniania w przyszłości?");
                if (wantsSave) {
                    // Zapisujemy w prostym Preferences, a NIE w Keychain
                    await Preferences.set({ key: BIO_AUTH_EMAIL_KEY, value: email });
                    await Preferences.set({ key: BIO_AUTH_PASSWORD_KEY, value: password });
                    toast.success("Dane do biometrii zapisane!");
                }
            }

            router.push('/dashboard/entries');

        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Wystąpił nieoczekiwany błąd.');
            } else {
                const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieznany błąd.';
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Funkcja do AUTO-UZUPEŁNIANIA (jak w zozoapp)
    const handleBiometricAutofill = async () => {
        if (!isNative) return;
        setIsLoading(true);
        try {
            // 1. Weryfikuj tożsamość
            await NativeBiometric.verifyIdentity({
                reason: 'Użyj biometrii, aby uzupełnić dane logowania',
                title: 'Weryfikacja tożsamości',
            });

            // 2. Pobierz dane z Preferences (a nie z Keychain)
            const [emailResult, passwordResult] = await Promise.all([
                Preferences.get({ key: BIO_AUTH_EMAIL_KEY }),
                Preferences.get({ key: BIO_AUTH_PASSWORD_KEY })
            ]);

            if (!emailResult.value || !passwordResult.value) {
                toast.error("Brak zapisanych danych do autouzupełnienia.");
                setIsLoading(false);
                return;
            }

            // 3. Uzupełnij pola formularza
            setEmail(emailResult.value);
            setPassword(passwordResult.value);
            toast.success("Dane uzupełnione. Kliknij 'Zaloguj się'.");

        } catch (e: unknown) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'Błąd biometrii';
            // Nie pokazuj błędu, jeśli użytkownik sam anulował
            if (!errorMessage.toLowerCase().includes('canceled') && !errorMessage.toLowerCase().includes('user interaction failed')) {
                toast.error('Logowanie biometryczne nie powiodło się.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Pokaż loader, dopóki sesja się wczytuje
    if (isHydrating) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100">Ładowanie sesji...</div>
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Zaloguj się</CardTitle>
                    <CardDescription>Witaj! Podaj swoje dane.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Adres e-mail</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Hasło</Label>
                                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? 'Logowanie...' : 'Zaloguj się'}
                            </Button>
                            {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
                        </div>
                    </form>

                    {isNative && canUseBiometrics && (
                        <>
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Lub</span>
                                </div>
                            </div>
                            <Button variant="outline" onClick={handleBiometricAutofill} disabled={isLoading} className="w-full">
                                <Fingerprint className="mr-2 h-4 w-4" />
                                Autouzupełnij biometrią
                            </Button>
                        </>
                    )}

                    <div className="mt-4 text-center text-sm">
                        Nie masz konta?{' '}
                        <Link href="/register" className="underline">
                            Zarejestruj się
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}