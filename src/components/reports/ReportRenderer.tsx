'use client';

import { useState } from 'react';
import { TemplateField } from '@/components/reports/TemplateBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, PenTool, Plus, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// ✅ Definiujemy konkretny typ dla wiersza tabeli
type TableRowData = Record<string, string>;

// ✅ Zmieniamy any[] na konkretny typ tablicy obiektów
type AnswerValue = string | number | boolean | TableRowData[];

interface ReportRendererProps {
    fields: TemplateField[];
    onSubmit: (answers: Record<string, AnswerValue>) => void;
    isSubmitting: boolean;
}

export function ReportRenderer({ fields, onSubmit, isSubmitting }: ReportRendererProps) {
    const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

    const handleChange = (fieldId: string, value: AnswerValue) => {
        setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    };

    // --- LOGIKA TABELI ---
    const addTableRow = (fieldId: string, columns: string[]) => {
        // ✅ Bezpieczne rzutowanie na konkretny typ
        const currentRows = (answers[fieldId] as TableRowData[]) || [];

        // Tworzymy pusty wiersz z kluczami odpowiadającymi nazwom kolumn
        const newRow: TableRowData = columns.reduce((acc, col) => ({ ...acc, [col]: '' }), {});

        handleChange(fieldId, [...currentRows, newRow]);
    };

    const removeTableRow = (fieldId: string, index: number) => {
        // ✅ Bezpieczne rzutowanie
        const currentRows = (answers[fieldId] as TableRowData[]) || [];
        const newRows = currentRows.filter((_, i) => i !== index);
        handleChange(fieldId, newRows);
    };

    const updateTableRow = (fieldId: string, index: number, colName: string, val: string) => {
        // ✅ Bezpieczne rzutowanie
        const currentRows = [...((answers[fieldId] as TableRowData[]) || [])];

        if (!currentRows[index]) return;

        currentRows[index] = { ...currentRows[index], [colName]: val };
        handleChange(fieldId, currentRows);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(answers);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map((field) => {
                // Sekcja
                if (field.type === 'section') {
                    return (
                        <div key={field.id} className="pt-4 pb-2 border-b">
                            <h3 className="text-lg font-semibold text-foreground">{field.label}</h3>
                        </div>
                    );
                }

                // Tabela
                if (field.type === 'table') {
                    const columns = field.columns || ['Kolumna 1'];
                    // ✅ Bezpieczne rzutowanie przy odczycie
                    const rows = (answers[field.id] as TableRowData[]) || [];

                    return (
                        <div key={field.id} className="space-y-2">
                            <Label>{field.label}</Label>
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            {columns.map((col, idx) => (
                                                <TableHead key={idx}>{col}</TableHead>
                                            ))}
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row, rowIndex) => (
                                            <TableRow key={rowIndex}>
                                                {columns.map((col, colIndex) => (
                                                    <TableCell key={colIndex} className="p-2">
                                                        <Input
                                                            value={row[col] || ''}
                                                            onChange={(e) => updateTableRow(field.id, rowIndex, col, e.target.value)}
                                                            className="h-8"
                                                        />
                                                    </TableCell>
                                                ))}
                                                <TableCell className="p-2">
                                                    <Button variant="ghost" size="icon" onClick={() => removeTableRow(field.id, rowIndex)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {rows.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={columns.length + 1} className="text-center py-4 text-muted-foreground text-sm">
                                                    Brak danych. Dodaj wiersz.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => addTableRow(field.id, columns)}>
                                <Plus className="h-4 w-4 mr-2" /> Dodaj wiersz
                            </Button>
                        </div>
                    );
                }

                // Pozostałe pola
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
                            />
                        )}

                        {field.type === 'checkbox' && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={field.id}
                                    checked={!!answers[field.id]}
                                    onCheckedChange={(checked) => handleChange(field.id, checked === true)}
                                />
                                <Label htmlFor={field.id} className="font-normal cursor-pointer text-muted-foreground">
                                    Zaznacz jeśli dotyczy
                                </Label>
                            </div>
                        )}

                        {field.type === 'photo' && (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                                    <Camera className="h-8 w-8 mb-2 opacity-50" />
                                    <p className="text-sm">Kliknij, aby dodać zdjęcie</p>
                                    <Input
                                        type="text"
                                        placeholder="Nazwa pliku (symulacja)"
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
                                        placeholder="Podpis"
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