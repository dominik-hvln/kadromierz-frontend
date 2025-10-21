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
import { Capacitor } from '@capacitor/core';

export default function LoginPage() {
    const router = useRouter();
    const { setSession } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [canUseBiometrics, setCanUseBiometrics] = useState(false);

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

            await NativeBiometric.verifyIdentity({
                reason: 'Zaloguj się do aplikacji',
                title: 'Weryfikacja tożsamości',
            });

            const credentials = await NativeBiometric.getCredentials({
                server: 'pl.kadromierz.hvln', // Użyj swojego App ID
            });

            const response = await api.post('/auth/login', {
                email: credentials.username,
                password: credentials.password,
            });

            const { session, profile } = response.data;
            setSession(session.access_token, profile);

            router.push('/');
            toast.success('Zalogowano pomyślnie!');

        } catch (e) {
            console.error(e);
            toast.error('Logowanie biometryczne nie powiodło się lub zostało anulowane.');
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ POPRAWIONY useEffect
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            const checkBiometricsAvailability = async () => {
                const { isAvailable } = await NativeBiometric.isAvailable();
                setCanUseBiometrics(isAvailable);
            };
            checkBiometricsAvailability();
        }
    }, []);

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

            if (Capacitor.isNativePlatform()) {
                const { isAvailable } = await NativeBiometric.isAvailable();
                if (isAvailable) {
                    await NativeBiometric.setCredentials({
                        username: email,
                        password: password,
                        server: 'pl.kadromierz.hvln',
                    });
                }
            }

            router.push('/');

        } catch (err) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Wystąpił nieoczekiwany błąd.');
            } else {
                setError('Wystąpił nieznany błąd.');
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
                    <CardDescription>Witaj z powrotem! Podaj swoje dane.</CardDescription>
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

                    {/* Ten blok jest teraz poprawnie kontrolowany przez stan `canUseBiometrics` */}
                    {canUseBiometrics && (
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