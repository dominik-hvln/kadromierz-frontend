'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AxiosError } from 'axios';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        if (!email || !password || !firstName || !lastName || !companyName) {
            setError('Wszystkie pola są wymagane.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.post('/auth/register', {
                email,
                password,
                firstName, // ZMIANA
                lastName,  // ZMIANA
                companyName,
            });

            setSuccess(response.data.message);

            setEmail('');
            setPassword('');
            setFirstName(''); // ZMIANA
            setLastName('');  // ZMIANA
            setCompanyName('');

            setTimeout(() => {
                router.push('/');
            }, 3000);

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
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Stwórz konto</CardTitle>
                    <CardDescription>Rozpocznij pracę ze swoją firmą w kilka chwil.</CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <p className="text-green-600 text-lg text-center">{success}</p>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="companyName">Nazwa firmy</Label>
                                    <Input id="companyName" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="firstName">Imię</Label>
                                        <Input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="lastName">Nazwisko</Label>
                                        <Input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Adres e-mail</Label>
                                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Hasło</Label>
                                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? 'Rejestrowanie...' : 'Stwórz konto'}
                                </Button>
                                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            </div>
                            <div className="mt-4 text-center text-sm">
                                Masz już konto?{' '}
                                <Link href="/" className="underline">
                                    Zaloguj się
                                </Link>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}