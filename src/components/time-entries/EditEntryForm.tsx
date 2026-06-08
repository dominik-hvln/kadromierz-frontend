'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/date-time-picker';

const formSchema = z.object({
    start_time: z.string().min(1, "Data rozpoczęcia jest wymagana."),
    end_time: z.string().nullable(),
    change_reason: z.string().min(5, { message: "Powód zmiany musi mieć co najmniej 5 znaków." }),
});

interface EditEntryFormProps {
    entry: { id: string; start_time: string; end_time: string | null };
    onSuccess: () => void;
}

export function EditEntryForm({ entry, onSuccess }: EditEntryFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            start_time: entry.start_time,
            end_time: entry.end_time,
            change_reason: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const payload: { start_time?: string; end_time?: string | null; change_reason: string } = {
                start_time: values.start_time || undefined,
                end_time: values.end_time || null,
                change_reason: values.change_reason,
            };

            if (!values.end_time) {
                delete payload.end_time;
            }

            await api.patch(`/time-entries/${entry.id}`, payload);
            toast.success('Sukces!', { description: 'Wpis został zaktualizowany.' });
            onSuccess();
        } catch (error) {
            toast.error('Błąd', { description: 'Nie udało się zaktualizować wpisu.' });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    name="start_time"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Czas rozpoczęcia</FormLabel>
                            <FormControl>
                                <DateTimePicker value={field.value} onChange={field.onChange} label="Wybierz start" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name="end_time"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Czas zakończenia</FormLabel>
                            <FormControl>
                                <DateTimePicker
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    label="Wybierz koniec"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="change_reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Powód zmiany</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Np. korekta pomyłki w godzinach" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                    Zapisz zmiany
                </Button>
            </form>
        </Form>
    );
}
