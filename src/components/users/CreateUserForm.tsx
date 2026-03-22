// src/components/users/CreateUserForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';

const formSchema = z.object({
    firstName: z.string().min(2, "Imię musi mieć co najmniej 2 znaki."),
    lastName: z.string().min(2, "Nazwisko musi mieć co najmniej 2 znaki."),
    email: z.string().email("Niepoprawny adres e-mail."),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków."),
    role: z.enum(['employee', 'manager', 'admin']),
    employmentType: z.string().optional(),
    departmentId: z.string().optional(),
    teamId: z.string().optional(),
    fteId: z.string().optional(),
    hourlyRate: z.coerce.number().optional(),
    contractEndDate: z.string().optional(),
    vacationDaysQuota: z.coerce.number().optional(),
    phoneNumber: z.string().optional(),
    emergencyContact: z.string().optional(),
});

export function CreateUserForm({ onSuccess, managers = [] }: { onSuccess: () => void, managers?: any[] }) {
    const [dictionaries, setDictionaries] = useState({ departments: [], teams: [], ftes: [] });

    useEffect(() => {
        const loadDicts = async () => {
            try {
                const [d, t, f] = await Promise.all([
                    api.get('/company-settings/departments'),
                    api.get('/company-settings/teams'),
                    api.get('/company-settings/ftes')
                ]);
                setDictionaries({ departments: d.data, teams: t.data, ftes: f.data });
            } catch(e) {}
        };
        loadDicts();
    }, []);

    const form = useForm<any>({
        resolver: zodResolver(formSchema),
        defaultValues: { firstName: '', lastName: '', email: '', password: '', role: 'employee' },
    });

    async function onSubmit(values: any) {
        try {
            const payload = Object.fromEntries(Object.entries(values).filter(([_, v]) => v !== '' && v !== undefined && v !== null && v !== 'none'));
            
            await api.post('/users', payload);
            toast.success('Sukces!', { description: 'Nowy pracownik został pomyślnie dodany.' });
            onSuccess();
        } catch (error) {
            toast.error('Błąd', { description: 'Nie udało się dodać pracownika.' });
        }
    }

    const watchDept = form.watch('departmentId');
    const filteredTeams = dictionaries.teams.filter((t: any) => t.department_id === watchDept);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-4">
                    <FormField name="firstName" render={({ field }) => ( <FormItem><FormLabel>Imię</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField name="lastName" render={({ field }) => ( <FormItem><FormLabel>Nazwisko</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField name="email" render={({ field }) => ( <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField name="password" render={({ field }) => ( <FormItem><FormLabel>Hasło tymczasowe</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                
                <FormField control={form.control as any} name="role" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Rola</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="employee">Pracownik</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="border-t pt-4 mt-4"><h3 className="font-semibold mb-2">Dane zatrudnienia</h3></div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control as any} name="employmentType" render={({ field }) => (
                        <FormItem><FormLabel>Forma zatrudnienia</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Umowa o pracę">Umowa o pracę</SelectItem>
                                    <SelectItem value="Umowa zlecenie">Umowa zlecenie</SelectItem>
                                    <SelectItem value="Umowa o dzieło">Umowa o dzieło</SelectItem>
                                    <SelectItem value="B2B">B2B</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField control={form.control as any} name="fteId" render={({ field }) => (
                        <FormItem><FormLabel>Wymiar etatu</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {dictionaries.ftes.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control as any} name="departmentId" render={({ field }) => (
                        <FormItem><FormLabel>Dział</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {dictionaries.departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField control={form.control as any} name="teamId" render={({ field }) => (
                        <FormItem><FormLabel>Zespół</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!watchDept}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {filteredTeams.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField name="hourlyRate" render={({ field }) => ( <FormItem><FormLabel>Stawka (zł)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField name="vacationDaysQuota" render={({ field }) => ( <FormItem><FormLabel>Pula urlopowa (dni)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField name="phoneNumber" render={({ field }) => ( <FormItem><FormLabel>Telefon</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField name="emergencyContact" render={({ field }) => ( <FormItem><FormLabel>Kontakt w razie wypadku (ICE)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>

                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full mt-6">
                    {form.formState.isSubmitting ? 'Dodawanie...' : 'Dodaj pracownika'}
                </Button>
            </form>
        </Form>
    );
}