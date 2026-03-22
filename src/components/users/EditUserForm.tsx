// src/components/users/EditUserForm.tsx
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
    status: z.string().optional(),
    managerId: z.string().optional(),
});

export function EditUserForm({ user, onSuccess, managers = [] }: { user: any, onSuccess: () => void, managers?: any[] }) {
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
        defaultValues: {
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            role: user.role || 'employee',
            employmentType: user.employment_type || '',
            departmentId: user.department_id || '',
            teamId: user.team_id || '',
            fteId: user.fte_id || '',
            hourlyRate: user.hourly_rate || undefined,
            contractEndDate: user.contract_end_date || '',
            vacationDaysQuota: user.vacation_days_quota || undefined,
            phoneNumber: user.phone_number || '',
            emergencyContact: user.emergency_contact || '',
            status: user.status || 'active',
            managerId: user.manager_id || 'none',
        },
    });

    async function onSubmit(values: any) {
        try {
            const payload = {
                firstName: values.firstName,
                lastName: values.lastName,
                role: values.role,
                employmentType: values.employmentType || null,
                departmentId: values.departmentId || null,
                teamId: values.teamId || null,
                fteId: values.fteId || null,
                hourlyRate: values.hourlyRate || null,
                contractEndDate: values.contractEndDate || null,
                vacationDaysQuota: values.vacationDaysQuota || null,
                phoneNumber: values.phoneNumber || null,
                emergencyContact: values.emergencyContact || null,
                status: values.status || 'active',
                managerId: values.managerId === 'none' ? null : values.managerId || null,
            };
            
            await api.patch(`/users/${user.id}`, payload);
            toast.success('Zaktualizowano pracownika!');
            onSuccess();
        } catch (error) {
            toast.error('Błąd przy aktualizacji danych.');
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
                    <FormField control={form.control as any} name="status" render={({ field }) => (
                        <FormItem><FormLabel>Status konta</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="active">Aktywny</SelectItem>
                                    <SelectItem value="suspended">Zawieszony / Na urlopie</SelectItem>
                                    <SelectItem value="terminated">Zwolniony</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                </div>

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
                                <FormControl><SelectTrigger><SelectValue placeholder="Brak" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {dictionaries.departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField control={form.control as any} name="teamId" render={({ field }) => (
                        <FormItem><FormLabel>Zespół</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!watchDept}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Brak" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {filteredTeams.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control as any} name="managerId" render={({ field }) => (
                        <FormItem><FormLabel>Przypisany Manager</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Brak" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="none">Brak (Główny profil)</SelectItem>
                                    {managers.filter(m => m.id !== user.id).map((m: any) => <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
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
                    {form.formState.isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </Button>
            </form>
        </Form>
    );
}
