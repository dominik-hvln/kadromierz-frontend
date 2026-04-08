import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ShiftDefinition {
    name: string;
    start_time: string;
    end_time: string;
}

interface DaySettings {
    is_working_day: boolean;
    shifts: ShiftDefinition[];
}

type WeekSettings = Record<string, DaySettings>;

const DAY_NAMES: Record<string, string> = {
    '1': 'Poniedziałek',
    '2': 'Wtorek',
    '3': 'Środa',
    '4': 'Czwartek',
    '5': 'Piątek',
    '6': 'Sobota',
    '0': 'Niedziela'
};

const defaultWeek: WeekSettings = {
    '1': { is_working_day: true, shifts: [] },
    '2': { is_working_day: true, shifts: [] },
    '3': { is_working_day: true, shifts: [] },
    '4': { is_working_day: true, shifts: [] },
    '5': { is_working_day: true, shifts: [] },
    '6': { is_working_day: false, shifts: [] },
    '0': { is_working_day: false, shifts: [] }
};

export default function SchedulesSettingsTab() {
    const [settings, setSettings] = useState<WeekSettings>(defaultWeek);
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        if (selectedDepartment) {
            fetchSettings(selectedDepartment);
        }
    }, [selectedDepartment]);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/company-settings/departments');
            if (res.data) {
                setDepartments(res.data);
                if (res.data.length > 0) {
                    setSelectedDepartment(res.data[0].id);
                }
            }
        } catch (error) {
            toast.error('Błąd podczas ładowania działów');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSettings = async (departmentId: string) => {
        try {
            const res = await api.get(`/schedules/settings?departmentId=${departmentId}`);
            if (res.data) {
                // merge with defaults to ensure all days exist
                const merged = { ...defaultWeek, ...res.data };
                setSettings(merged);
            }
        } catch (error) {
            toast.error('Błąd podczas ładowania ustawień grafiku');
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async () => {
        if (!selectedDepartment) return;
        try {
            await api.put(`/schedules/settings?departmentId=${selectedDepartment}`, settings);
            toast.success('Zapisano ustawienia grafiku pracy');
        } catch (error) {
            toast.error('Błąd zapisu ustawień');
        }
    };

    const toggleWorkingDay = (day: string) => {
        setSettings(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                is_working_day: !prev[day].is_working_day
            }
        }));
    };

    const addShift = (day: string) => {
        setSettings(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                shifts: [...prev[day].shifts, { name: '', start_time: '06:00', end_time: '14:00' }]
            }
        }));
    };

    const removeShift = (day: string, index: number) => {
        setSettings(prev => {
            const newShifts = [...prev[day].shifts];
            newShifts.splice(index, 1);
            return {
                ...prev,
                [day]: { ...prev[day], shifts: newShifts }
            };
        });
    };

    const updateShift = (day: string, index: number, field: keyof ShiftDefinition, value: string) => {
        setSettings(prev => {
            const newShifts = [...prev[day].shifts];
            newShifts[index] = { ...newShifts[index], [field]: value };
            return {
                ...prev,
                [day]: { ...prev[day], shifts: newShifts }
            };
        });
    };

    if (isLoading) return <div>Ładowanie...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 mb-6">
                <h2 className="text-xl font-semibold">Definicja Zmian Pracowniczych</h2>
                <div className="w-full md:w-1/3">
                    <Label className="mb-2 block">Dział</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger>
                            <SelectValue placeholder="Wybierz dział" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {!selectedDepartment ? (
                <div className="text-center py-10 border rounded-md bg-muted/20">
                    <p className="text-muted-foreground">Wybierz dział, aby skonfigurować zmiany.</p>
                </div>
            ) : (
                <div>
                    <p className="text-sm text-gray-500 mb-6">Ustal dni robocze oraz zdefiniuj godziny poszczególnych zmian w tych dniach (np. I Zmiana, II Zmiana).</p>
                <div className="flex justify-end mb-4">
                    <Button onClick={saveSettings} className="gap-2">
                        <Save className="h-4 w-4" /> Zapisz Ustawienia
                    </Button>
                </div>
                
                <div className="space-y-6">
                    {['1', '2', '3', '4', '5', '6', '0'].map((dayKey) => {
                        const dayData = settings[dayKey];
                        return (
                            <div key={dayKey} className="border rounded-md p-4 bg-background">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <Switch 
                                            id={`working-day-${dayKey}`}
                                            checked={dayData.is_working_day}
                                            onCheckedChange={() => toggleWorkingDay(dayKey)}
                                        />
                                        <Label htmlFor={`working-day-${dayKey}`} className="text-lg font-medium">
                                            {DAY_NAMES[dayKey]} {!dayData.is_working_day && <span className="text-muted-foreground text-sm font-normal ml-2">(Wolne)</span>}
                                        </Label>
                                    </div>
                                    
                                    {dayData.is_working_day && (
                                        <Button variant="outline" size="sm" onClick={() => addShift(dayKey)} className="gap-2">
                                            <PlusCircle className="h-4 w-4" /> Dodaj zmianę
                                        </Button>
                                    )}
                                </div>

                                {dayData.is_working_day && (
                                    <div className="space-y-3 pl-12">
                                        {dayData.shifts.map((shift, idx) => (
                                            <div key={idx} className="flex items-center gap-4 bg-muted/30 p-2 rounded-md border text-sm">
                                                <div className="flex-1">
                                                    <Label className="text-xs text-muted-foreground mb-1 block">Nazwa zmiany</Label>
                                                    <Input 
                                                        value={shift.name} 
                                                        onChange={(e) => updateShift(dayKey, idx, 'name', e.target.value)}
                                                        placeholder="np. Zmiana Ranna" 
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <Label className="text-xs text-muted-foreground mb-1 block">Od (GG:MM)</Label>
                                                    <Input 
                                                        type="time" 
                                                        value={shift.start_time} 
                                                        onChange={(e) => updateShift(dayKey, idx, 'start_time', e.target.value)}
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <Label className="text-xs text-muted-foreground mb-1 block">Do (GG:MM)</Label>
                                                    <Input 
                                                        type="time" 
                                                        value={shift.end_time} 
                                                        onChange={(e) => updateShift(dayKey, idx, 'end_time', e.target.value)}
                                                    />
                                                </div>
                                                <div className="mt-5">
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeShift(dayKey, idx)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {dayData.shifts.length === 0 && (
                                            <p className="text-sm text-amber-600">Brak zdefiniowanych zmian. Pracownicy nie będą mieli przypisanego grafiku w ten dzień.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t">
                <Button onClick={saveSettings} size="lg" className="gap-2">
                    <Save className="h-4 w-4" /> Zapisz Ustawienia
                </Button>
            </div>
            )}
        </div>
    );
}
