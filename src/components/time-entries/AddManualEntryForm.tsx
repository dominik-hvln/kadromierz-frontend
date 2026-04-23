'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const formSchema = z.object({
    user_id: z.string().min(1, "Wybór pracownika jest wymagany."),
    start_time: z.string().min(1, "Czas rozpoczęcia jest wymagany."),
    end_time: z.string().min(1, "Czas zakończenia jest wymagany."),
    manual_comment: z.string().min(5, { message: "Komentarz musi mieć co najmniej 5 znaków." }),
    project_id: z.string().optional(),
    task_id: z.string().optional(),
}).refine((data) => {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    return end > start;
}, {
    message: "Czas zakończenia musi być po czasie rozpoczęcia",
    path: ["end_time"],
});

interface User {
    id: string;
    first_name: string;
    last_name: string;
}

interface Project {
    id: string;
    name: string;
}

interface Task {
    id: string;
    name: string;
    project_id: string;
}

interface AddManualEntryFormProps {
    onSuccess: () => void;
}

export function AddManualEntryForm({ onSuccess }: AddManualEntryFormProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [openUserPopover, setOpenUserPopover] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            user_id: '',
            start_time: '',
            end_time: '',
            manual_comment: '',
            project_id: 'none',
            task_id: 'none',
        },
    });

    const selectedProjectId = form.watch('project_id');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, projectsRes, tasksRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/projects'),
                    api.get('/tasks')
                ]);
                setUsers(usersRes.data);
                setProjects(projectsRes.data);
                setTasks(tasksRes.data);
            } catch (error) {
                console.error("Błąd podczas pobierania danych:", error);
                toast.error("Błąd", { description: "Nie udało się załadować danych pomocniczych." });
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchData();
    }, []);

    const filteredTasks = (selectedProjectId && selectedProjectId !== 'none')
        ? tasks.filter(t => t.project_id === selectedProjectId)
        : [];

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const start = new Date(values.start_time);
            const end = new Date(values.end_time);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                toast.error('Błąd', { description: 'Nieprawidłowy format daty.' });
                return;
            }

            const payload = {
                ...values,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                project_id: (values.project_id && values.project_id !== 'none') ? values.project_id : null,
                task_id: (values.task_id && values.task_id !== 'none') ? values.task_id : null,
            };

            await api.post('/time-entries/manual', payload);
            toast.success('Sukces!', { description: 'Wpis został dodany ręcznie.' });
            onSuccess();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Nie udało się dodać wpisu.';
            toast.error('Błąd', { description: message });
        }
    }

    if (isLoadingData) return <div className="p-4 text-center">Ładowanie danych...</div>;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="user_id"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Pracownik</FormLabel>
                            <Popover open={openUserPopover} onOpenChange={setOpenUserPopover}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value
                                                ? users.find((user) => user.id === field.value)
                                                    ? `${users.find((user) => user.id === field.value)?.first_name} ${users.find((user) => user.id === field.value)?.last_name}`
                                                    : "Wybierz pracownika..."
                                                : "Wybierz pracownika..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Szukaj pracownika..." />
                                        <CommandList>
                                            <CommandEmpty>Nie znaleziono pracownika.</CommandEmpty>
                                            <CommandGroup>
                                                {users.map((user) => (
                                                    <CommandItem
                                                        value={`${user.first_name} ${user.last_name}`}
                                                        key={user.id}
                                                        onSelect={() => {
                                                            form.setValue("user_id", user.id);
                                                            setOpenUserPopover(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                user.id === field.value ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {user.first_name} {user.last_name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Czas rozpoczęcia</FormLabel>
                                <FormControl>
                                    <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="end_time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Czas zakończenia</FormLabel>
                                <FormControl>
                                    <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="project_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Projekt (opcjonalnie)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Wybierz projekt" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Brak projektu</SelectItem>
                                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="task_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Zlecenie (opcjonalnie)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedProjectId}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Wybierz zlecenie" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Brak zlecenia</SelectItem>
                                        {filteredTasks.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="manual_comment"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Komentarz / Powód</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Np. Pracownik zapomniał odbić się przy wyjściu" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                    Dodaj wpis
                </Button>
            </form>
        </Form>
    );
}
