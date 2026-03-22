'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
    const { user, setUser } = useAuthStore();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setPhoneNumber(user.phone_number || '');
            setEmergencyContact(user.emergency_contact || '');
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await api.patch('/users/me/profile', {
                phoneNumber: phoneNumber || null,
                emergencyContact: emergencyContact || null
            });
            setUser(response.data);
            toast.success('Zaktualizowano profil!');
        } catch (error) {
            toast.error('Wystąpił błąd podczas aktualizacji danych.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mój Profil</h1>
                <p className="text-muted-foreground">Aktualizuj swoje dane kontaktowe.</p>
            </div>

            <div className="glassmorphism-box p-6 space-y-6">
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold">{user?.first_name} {user?.last_name}</h2>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                        <Label className="text-muted-foreground">Rola</Label>
                        <p className="font-medium capitalize">{user?.role === 'employee' ? 'Pracownik' : user?.role}</p>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Forma zatrudnienia</Label>
                        <p className="font-medium">{user?.employment_type || 'Brak danych'}</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold mb-4">Dane Kontaktowe</h3>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Numer telefonu</Label>
                        <Input 
                            id="phone" 
                            type="tel" 
                            placeholder="+48 123 456 789" 
                            value={phoneNumber} 
                            onChange={(e) => setPhoneNumber(e.target.value)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ice">Kontakt alarmowy (ICE)</Label>
                        <Input 
                            id="ice" 
                            placeholder="np. Jan Kowalski (Mąż) - 111 222 333" 
                            value={emergencyContact} 
                            onChange={(e) => setEmergencyContact(e.target.value)} 
                        />
                        <p className="text-xs text-muted-foreground">Osoba, którą należy powiadomić w razie nagłego wypadku.</p>
                    </div>

                    <Button type="submit" disabled={isLoading} className="mt-6">
                        {isLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
