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
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core'; // Upewnij się, że ten import jest

export default function LoginPage() { // Zmieniamy nazwę dla jasności, ale export default jest kluczowy
    const router = useRouter();
    const { setSession } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [canUseBiometrics, setCanUseBiometrics] = useState(false);
    const [isNative, setIsNative] = useState(false);

    // Funkcja do logowania biometrycznego
    const handleBiometricLogin = async () => {
        if (!Capacitor.isNativePlatform()) {
            toast.info('Biometria jest dostępna tylko w aplikacji mobilnej.');
            return;
        }
        setIsLoading(true);
        try {
            const { isAvailable } = await NativeBiometric.isAvailable();
            if (!isAvailable) {
                toast.error('Biometria niedostępna.');
                setIsLoading(false);
                return;
            }

            // Najpierw weryfikuj
            await NativeBiometric.verifyIdentity({
                reason: 'Zaloguj się do aplikacji',
                title: 'Weryfikacja tożsamości',
            });

            // Dopiero potem pobierz dane
            const credentials = await NativeBiometric.getCredentials({
                server: 'pl.kadromierz.hvln', // Użyj swojego App ID
            });

            const response = await api.post('/auth/login', {
                email: credentials.username,
                password: credentials.password,
            });

            const { session, profile } = response.data;
            setSession(session.access_token, profile);

            router.push('/dashboard/entries'); // Przekieruj do dashboardu
            toast.success('Zalogowano pomyślnie!');

        } catch (e: unknown) {
            console.error(e);
            // Nie pokazuj błędu, jeśli użytkownik sam anulował
            if (e instanceof Error && !e.message.toLowerCase().includes('canceled')) {
                toast.error('Logowanie biometryczne nie powiodło się.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Sprawdza dostępność biometrii przy ładowaniu
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            const checkBiometricsAvailability = async () => {
                const { isAvailable } = await NativeBiometric.isAvailable();
                setCanUseBiometrics(isAvailable);
            };
            checkBiometricsAvailability();
        }
    }, []);

    // Funkcja logowania hasłem
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
            setSession(session.access_token, profile);

            // Zapisz dane dla biometrii (tylko na mobile)
            if (Capacitor.isNativePlatform()) {
                const { isAvailable } = await NativeBiometric.isAvailable();
                if (isAvailable) {
                    await NativeBiometric.setCredentials({
                        username: email,
                        password: password,
                        server: 'pl.kadromierz.hvln', // Użyj swojego App ID
                    });
                }
            }

            router.push('/dashboard/entries'); // Przekieruj do dashboardu

        } catch (err: unknown) { // Poprawiony typ błędu
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

                    {/* Przycisk biometrii */}
                    {isNative && canUseBiometrics && ( // Pokaż tylko w aplikacji mobilnej, jeśli dostępne
                        <>
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Lub</span>
                                </div>
                            </div>
                            <Button variant="outline" onClick={handleBiometricLogin} disabled={isLoading} className="w-full">
                                <Fingerprint className="mr-2 h-4 w-4" />
                                Użyj biometrii
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