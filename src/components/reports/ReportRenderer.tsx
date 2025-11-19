'use client';

import { useState } from 'react';
import { TemplateField } from '@/components/reports/TemplateBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, PenTool } from 'lucide-react';

// ✅ Definiujemy typ możliwych odpowiedzi, zamiast 'any'
type AnswerValue = string | number | boolean;

interface ReportRendererProps {
    fields: TemplateField[];
    // ✅ Zmieniamy 'any' na konkretny typ
    onSubmit: (answers: Record<string, AnswerValue>) => void;
    isSubmitting: boolean;
}

export function ReportRenderer({ fields, onSubmit, isSubmitting }: ReportRendererProps) {
    // ✅ Zmieniamy 'any' na konkretny typ
    const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

    // ✅ Zmieniamy 'any' na konkretny typ
    const handleChange = (fieldId: string, value: AnswerValue) => {
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

                        {field.type === 'text' && (
                            <Input
                                id={field.id}
                                required={field.required}
                                value={(answers[field.id] as string) || ''}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                placeholder="Wpisz tekst..."
                            />
                        )}

                        {field.type === 'textarea' && (
                            <Textarea
                                id={field.id}
                                required={field.required}
                                value={(answers[field.id] as string) || ''}
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
                                value={(answers[field.id] as string) || ''}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                placeholder="0"
                            />
                        )}

                        {/* ✅ POPRAWKA: Używamy komponentu Checkbox zamiast <input> */}
                        {field.type === 'checkbox' && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={field.id}
                                    checked={!!answers[field.id]}
                                    // Shadcn Checkbox używa onCheckedChange, a nie onChange
                                    onCheckedChange={(checked) => handleChange(field.id, checked === true)}
                                />
                                <Label
                                    htmlFor={field.id}
                                    className="text-sm text-muted-foreground font-normal cursor-pointer"
                                >
                                    Zaznacz jeśli dotyczy
                                </Label>
                            </div>
                        )}

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