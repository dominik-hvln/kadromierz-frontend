'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkNormsTab() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin';

    const [dailyNorm, setDailyNorm] = useState('8');
    const [countHolidays, setCountHolidays] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api
            .get('/company-settings/work-norms')
            .then(({ data }) => {
                setDailyNorm(String(data.daily_norm_hours ?? 8));
                setCountHolidays(data.count_holidays_as_work !== false);
            })
            .catch(() => toast.error('Nie udało się pobrać ustawień czasu pracy'))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        const norm = Number(dailyNorm.replace(',', '.'));
        if (isNaN(norm) || norm < 0 || norm > 24) {
            toast.error('Norma dobowa musi być z zakresu 0–24 godzin.');
            return;
        }
        setSaving(true);
        try {
            await api.patch('/company-settings/work-norms', {
                daily_norm_hours: norm,
                count_holidays_as_work: countHolidays,
            });
            toast.success('Zapisano ustawienia czasu pracy');
        } catch {
            toast.error('Błąd zapisu ustawień');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Ładowanie…</div>;
    }

    return (
        <div className="space-y-6 max-w-xl">
            <div>
                <h3 className="text-lg font-semibold">Norma czasu pracy</h3>
                <p className="text-sm text-muted-foreground">
                    Godziny nieobecności (urlop, L4) i świąt w podsumowaniu ewidencji liczone są na podstawie
                    dni roboczych i godzin zmian zdefiniowanych w zakładce <strong>Grafik Zmian</strong> (per dział),
                    pomnożonych przez wymiar etatu (FTE). Poniższa norma dobowa to wartość zapasowa, używana gdy
                    dany dzień roboczy nie ma ustawionych godzin zmiany.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="daily_norm">Norma dobowa — zapasowa (godziny)</Label>
                <Input
                    id="daily_norm"
                    type="text"
                    inputMode="decimal"
                    value={dailyNorm}
                    onChange={(e) => setDailyNorm(e.target.value)}
                    className="w-40"
                    disabled={!isAdmin}
                    placeholder="np. 8"
                />
                <p className="text-xs text-muted-foreground">Używana tylko, gdy dzień roboczy nie ma zdefiniowanych godzin zmiany. Dla 1/2 etatu i normy 8h liczone jest 4h/dzień.</p>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
                <Switch
                    id="count_holidays"
                    checked={countHolidays}
                    onCheckedChange={setCountHolidays}
                    disabled={!isAdmin}
                />
                <div>
                    <Label htmlFor="count_holidays" className="cursor-pointer">Wliczaj święta do godzin pracy</Label>
                    <p className="text-xs text-muted-foreground">
                        Dni ustawowo wolne przypadające w dzień roboczy (wg grafiku działu) doliczane są jako godziny.
                    </p>
                </div>
            </div>

            {isAdmin ? (
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Zapisz
                </Button>
            ) : (
                <p className="text-xs text-muted-foreground">Zmianę ustawień może wykonać administrator firmy.</p>
            )}
        </div>
    );
}
