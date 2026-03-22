'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const formSchema = z.object({
    type: z.string().min(1, "Wybierz typ nieobecności."),
    startDate: z.string().min(1, "Wybierz datę początkową."),
    endDate: z.string().min(1, "Wybierz datę końcową."),
    reason: z.string().optional(),
});

interface Props {
    onSuccess: () => void;
}

export default function CreateAbsenceForm({ onSuccess }: Props) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: '',
            startDate: '',
            endDate: '',
            reason: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (new Date(values.endDate) < new Date(values.startDate)) {
            form.setError('endDate', { type: 'manual', message: 'Data końcowa nie może być przed początkową.' });
            return;
        }

        try {
            await api.post('/absences', values);
            toast.success('Pomyślnie wysłano wniosek o nieobecność.');
            onSuccess();
        } catch (error) {
            toast.error('Błąd podczas wysyłania wniosku.');
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Typ nieobecności</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Wybierz typ..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="urlop_wypoczynkowy">Urlop Wypoczynkowy</SelectItem>
                                <SelectItem value="l4">Zwolnienie Lekarskie (L4)</SelectItem>
                                <SelectItem value="urlop_na_zadanie">Urlop na Żądanie</SelectItem>
                                <SelectItem value="inne">Inne (np. opieka)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                        <FormItem><FormLabel>Od {field.value && `(${field.value})`}</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="endDate" render={({ field }) => (
                        <FormItem><FormLabel>Do {field.value && `(${field.value})`}</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="reason" render={({ field }) => (
                    <FormItem><FormLabel>Komentarz / Powód (opcjonalnie)</FormLabel>
                        <FormControl><Textarea placeholder="Uwagi dla managera..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Wysyłanie...' : 'Wyślij wniosek'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
