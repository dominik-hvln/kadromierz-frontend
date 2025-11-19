'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { TemplateBuilder, TemplateField } from '@/components/reports/TemplateBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

// Pomocniczy interfejs, żeby TypeScript wiedział, czego szukamy w obiekcie user
interface UserWithCompany {
    company_id?: string;
}

export default function NewTemplatePage() {
    const router = useRouter();
    const { user } = useAuthStore();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [fields, setFields] = useState<TemplateField[]>([]);
    const [loading, setLoading] = useState(false);
    const [primaryColor, setPrimaryColor] = useState('#0f172a'); // Domyślny granat
    const [headerText, setHeaderText] = useState('');

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
            // ✅ POPRAWKA 1: Bezpieczne rzutowanie typu zamiast 'any'
            // Mówimy TypeScriptowi: "Traktuj usera jako obiekt, który może mieć company_id"
            const companyId = (user as unknown as UserWithCompany)?.company_id;

            if (!companyId) {
                toast.error('Błąd: Nie znaleziono ID firmy zalogowanego użytkownika.');
                return;
            }

            await api.post('/report-templates', {
                name,
                description,
                companyId,
                fields,
                style: { primaryColor, headerText }
            });

            toast.success('Szablon zapisany pomyślnie');
            router.push('/dashboard/reports/templates');
        } catch (error) {
            // ✅ POPRAWKA 2: Usunęliśmy ': any'.
            // TypeScript traktuje 'error' jako unknown, co pozwala na console.error
            console.error(error);
            toast.error('Nie udało się zapisać szablonu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Wygląd PDF</CardTitle>
                            <CardDescription>Spersonalizuj wydruk.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Kolor przewodni</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="color"
                                        className="w-12 h-10 p-1 cursor-pointer"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                    />
                                    <span className="text-sm text-muted-foreground">{primaryColor}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Nagłówek dokumentu</Label>
                                <Input
                                    placeholder="np. Protokół Serwisowy"
                                    value={headerText}
                                    onChange={(e) => setHeaderText(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card className="min-h-[600px]">
                        <CardHeader>
                            <CardTitle>Konstruktor Formularza</CardTitle>
                            <CardDescription>
                                Przeciągaj elementy, aby ustalić kolejność w raporcie.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TemplateBuilder fields={fields} setFields={setFields} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}