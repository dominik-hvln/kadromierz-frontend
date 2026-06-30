'use client';

import { useEffect, useState } from 'react';
import { superAdminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
    const [financeEmail, setFinanceEmail] = useState('');
    const [bankDetails, setBankDetails] = useState('');
    const [announcement, setAnnouncement] = useState('');
    const [trialDays, setTrialDays] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        superAdminApi
            .getSettings()
            .then((s) => {
                setFinanceEmail(s.finance_notification_email || '');
                setBankDetails(s.bank_transfer_details || '');
                setAnnouncement(s.global_announcement || '');
                setTrialDays(s.default_trial_days || '');
            })
            .catch(() => toast.error('Błąd pobierania ustawień'))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        if (financeEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(financeEmail.trim())) {
            toast.error('Podaj poprawny adres e-mail działu finansowego.');
            return;
        }
        setSaving(true);
        try {
            await Promise.all([
                superAdminApi.updateSetting('finance_notification_email', financeEmail.trim() || null),
                superAdminApi.updateSetting('bank_transfer_details', bankDetails.trim() || null),
                superAdminApi.updateSetting('global_announcement', announcement.trim() || null),
                superAdminApi.updateSetting('default_trial_days', trialDays.trim() || null),
            ]);
            toast.success('Ustawienia zapisane');
        } catch {
            toast.error('Błąd zapisu ustawień');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Ładowanie ustawień…</div>;

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Ustawienia globalne</h1>
                <p className="text-muted-foreground text-sm">Konfiguracja obowiązująca w całym systemie.</p>
            </div>

            <div className="bg-white rounded-xl border p-6 space-y-2">
                <Label htmlFor="finance_email">Adres e-mail działu finansowego</Label>
                <p className="text-xs text-muted-foreground">Powiadomienie o wyborze płatności przelewem trafia na ten adres.</p>
                <Input id="finance_email" type="email" value={financeEmail} onChange={(e) => setFinanceEmail(e.target.value)} placeholder="finanse@firma.pl" />
            </div>

            <div className="bg-white rounded-xl border p-6 space-y-2">
                <Label htmlFor="bank_details">Dane do przelewu</Label>
                <p className="text-xs text-muted-foreground">Pokazywane firmie po wyborze płatności przelewem (np. nazwa odbiorcy, nr konta, tytuł).</p>
                <Textarea id="bank_details" rows={4} value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} placeholder={'Odbiorca: ...\nNr konta: ...\nTytuł: subskrypcja [NIP]'} />
            </div>

            <div className="bg-white rounded-xl border p-6 space-y-2">
                <Label htmlFor="announcement">Globalne ogłoszenie (baner)</Label>
                <p className="text-xs text-muted-foreground">Wyświetlane na górze panelu wszystkim zalogowanym. Pozostaw puste, aby ukryć.</p>
                <Textarea id="announcement" rows={3} value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="np. Planowana przerwa techniczna w sobotę 22:00–23:00." />
            </div>

            <div className="bg-white rounded-xl border p-6 space-y-2">
                <Label htmlFor="trial_days">Domyślna długość okresu próbnego (dni)</Label>
                <p className="text-xs text-muted-foreground">Informacyjnie / do przyszłego użycia przy zakładaniu firm.</p>
                <Input id="trial_days" type="number" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} placeholder="np. 14" className="w-40" />
            </div>

            <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Zapisz ustawienia
            </Button>
        </div>
    );
}
