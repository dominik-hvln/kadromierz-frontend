'use client';

import { useState } from 'react';
import { TemplateField } from '@/components/reports/TemplateBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox'; // Jeśli nie masz tego komponentu UI, użyj zwykłego input type="checkbox"
import { Camera, PenTool } from 'lucide-react';

interface ReportRendererProps {
    fields: TemplateField[];
    onSubmit: (answers: Record<string, any>) => void;
    isSubmitting: boolean;
}

export function ReportRenderer({ fields, onSubmit, isSubmitting }: ReportRendererProps) {
    // Stan trzymający odpowiedzi: { "field_123": "Odpowiedź" }
    const [answers, setAnswers] = useState<Record<string, any>>({});

    const handleChange = (fieldId: string, value: any) => {
        setAnswers((prev) => ({
            ...prev,
            [fieldId]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(answers);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map((field) => {
                // Obsługa sekcji (nagłówków)
                if (field.type === 'section') {
                    return (
                        <div key={field.id} className="pt-4 pb-2 border-b">
                            <h3 className="text-lg font-semibold text-foreground">{field.label}</h3>
                        </div>
                    );
                }

                return (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>

                        {/* Renderowanie odpowiedniego pola */}
                        {field.type === 'text' && (
                            <Input
                                id={field.id}
                                required={field.required}
                                value={answers[field.id] || ''}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                placeholder="Wpisz tekst..."
                            />
                        )}

                        {field.type === 'textarea' && (
                            <Textarea
                                id={field.id}
                                required={field.required}
                                value={answers[field.id] || ''}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                placeholder="Wpisz dłuższy opis..."
                                className="min-h-[100px]"
                            />
                        )}

                        {field.type === 'number' && (
                            <Input
                                id={field.id}
                                type="number"
                                required={field.required}
                                value={answers[field.id] || ''}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                placeholder="0"
                            />
                        )}

                        {field.type === 'checkbox' && (
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id={field.id}
                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={!!answers[field.id]}
                                    onChange={(e) => handleChange(field.id, e.target.checked)}
                                />
                                <span className="text-sm text-muted-foreground">Zaznacz jeśli dotyczy</span>
                            </div>
                        )}

                        {/* Placeholder dla Zdjęcia - w przyszłości upload plików */}
                        {field.type === 'photo' && (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                                    <Camera className="h-8 w-8 mb-2 opacity-50" />
                                    <p className="text-sm">Kliknij, aby dodać zdjęcie (symulacja)</p>
                                    <Input
                                        type="text"
                                        placeholder="Tutaj wpisz nazwę pliku (tymczasowo)"
                                        className="mt-2"
                                        onChange={(e) => handleChange(field.id, e.target.value)}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Placeholder dla Podpisu */}
                        {field.type === 'signature' && (
                            <Card className="bg-muted/20">
                                <CardContent className="py-6">
                                    <div className="border-b-2 border-gray-300 h-16 mb-2 relative">
                                        <PenTool className="absolute bottom-2 right-2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <Input
                                        placeholder="Wpisz imię i nazwisko jako podpis"
                                        required={field.required}
                                        onChange={(e) => handleChange(field.id, e.target.value)}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );
            })}

            <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Wysyłanie raportu...' : 'Zatwierdź Raport'}
                </Button>
            </div>
        </form>
    );
}