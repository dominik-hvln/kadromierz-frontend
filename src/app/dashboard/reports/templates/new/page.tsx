'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api'; //
import { TemplateBuilder, TemplateField } from '@/components/reports/TemplateBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store'; //

export default function NewTemplatePage() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [fields, setFields] = useState<TemplateField[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Podaj nazwę szablonu');
            return;
        }
        if (fields.length === 0) {
            toast.error('Dodaj przynajmniej jedno pole do szablonu');
            return;
        }

        setLoading(true);
        try {
            // Backend oczekuje: name, description, companyId, fields
            // CompanyId weźmiemy z profilu usera (zakładając, że admin ma company_id)
            // Jeśli super-admin tworzy, trzeba by dodać wybór firmy, ale załóżmy uproszczenie dla managera/admina firmy

            /* UWAGA: Jeśli jesteś zalogowany jako SuperAdmin bez przypisanej firmy w bazie (company_id: null),
               backend może zwrócić błąd. Wtedy musielibyśmy dodać Select firmy jak przy tworzeniu usera.
               Zakładam, że testujesz to na userze, który MA firmę, lub dodasz company_id do swojego superadmina.
            */

            // Pobieramy companyId z usera lub (tymczasowo dla testów) hardcodujemy, jeśli user go nie ma
            const companyId = (user as any)?.company_id;

            if (!companyId) {
                toast.error('Błąd: Nie znaleziono ID firmy zalogowanego użytkownika.');
                return;
            }

            await api.post('/report-templates', {
                name,
                description,
                companyId,
                fields
            });

            toast.success('Szablon zapisany pomyślnie');
            router.push('/dashboard/reports/templates'); // Przekierowanie do listy (którą zaraz zrobimy)
        } catch (error: any) {
            console.error(error);
            toast.error('Nie udało się zapisać szablonu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            {/* Nagłówek i przyciski akcji */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Nowy Szablon Raportu</h1>
                        <p className="text-muted-foreground">Zdefiniuj strukturę raportu dla swoich pracowników.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>Anuluj</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? 'Zapisywanie...' : 'Zapisz Szablon'}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Lewa kolumna: Ustawienia ogólne */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informacje</CardTitle>
                            <CardDescription>Podstawowe dane szablonu.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nazwa szablonu <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    placeholder="np. Raport Serwisowy Klimatyzacji"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc">Opis (opcjonalnie)</Label>
                                <Input
                                    id="desc"
                                    placeholder="Krótki opis przeznaczenia"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tu w przyszłości dodamy np. ustawienia wyglądu PDF (kolor, logo) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Wygląd PDF</CardTitle>
                            <CardDescription>Opcje generowania (wkrótce).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">
                                Opcje nagłówka, stopki i tabel będą dostępne w kolejnym kroku.
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Prawa kolumna: Builder pól */}
                <div className="md:col-span-2">
                    <Card className="min-h-[600px]">
                        <CardHeader>
                            <CardTitle>Konstruktor Formularza</CardTitle>
                            <CardDescription>
                                Przeciągaj elementy, aby ustalić kolejność w raporcie.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Nasz komponent Drag & Drop */}
                            <TemplateBuilder fields={fields} setFields={setFields} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}