'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { billingApi, BillingProfilePayload } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY: BillingProfilePayload = {
    legal_name: '',
    tax_id: '',
    billing_street: '',
    billing_postal_code: '',
    billing_city: '',
    billing_email: '',
};

export function validateBillingProfile(form: BillingProfilePayload): string | null {
    if (!form.legal_name.trim()) return 'Podaj nazwę firmy.';
    if (!/^\d{10}$/.test(form.tax_id.trim())) return 'NIP musi składać się z 10 cyfr.';
    if (!form.billing_street.trim()) return 'Podaj ulicę i numer.';
    if (!/^\d{2}-\d{3}$/.test(form.billing_postal_code.trim())) return 'Kod pocztowy w formacie 00-000.';
    if (!form.billing_city.trim()) return 'Podaj miasto.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.billing_email.trim())) return 'Podaj poprawny e-mail do faktur.';
    return null;
}

interface Props {
    /** Wywoływane po pomyślnym zapisie (profil już odświeżony w store). */
    onSaved?: () => void;
    saveLabel?: string;
    complete?: boolean;
}

export default function BillingProfileForm({ onSaved, saveLabel, complete }: Props) {
    const { user, refreshSession } = useAuthStore();
    const c = user?.company;

    const [form, setForm] = useState<BillingProfilePayload>({
        legal_name: c?.legal_name || '',
        tax_id: c?.tax_id || '',
        billing_street: c?.billing_street || '',
        billing_postal_code: c?.billing_postal_code || '',
        billing_city: c?.billing_city || '',
        billing_email: c?.billing_email || user?.email || '',
    });
    const [saving, setSaving] = useState(false);

    const setField = (k: keyof BillingProfilePayload, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const handleSave = async () => {
        const err = validateBillingProfile(form);
        if (err) {
            toast.error(err);
            return;
        }
        setSaving(true);
        try {
            await billingApi.updateProfile(form);
            await refreshSession();
            toast.success('Dane firmy zapisane');
            onSaved?.();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Błąd zapisu danych firmy');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <Label htmlFor="legal_name">Nazwa firmy (do faktury)</Label>
                    <Input id="legal_name" value={form.legal_name} onChange={(e) => setField('legal_name', e.target.value)} placeholder="np. ACME Sp. z o.o." />
                </div>
                <div>
                    <Label htmlFor="tax_id">NIP</Label>
                    <Input id="tax_id" value={form.tax_id} onChange={(e) => setField('tax_id', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="1234567890" inputMode="numeric" />
                </div>
                <div>
                    <Label htmlFor="billing_email">E-mail do faktur</Label>
                    <Input id="billing_email" type="email" value={form.billing_email} onChange={(e) => setField('billing_email', e.target.value)} placeholder="faktury@firma.pl" />
                </div>
                <div className="md:col-span-2">
                    <Label htmlFor="billing_street">Ulica i numer</Label>
                    <Input id="billing_street" value={form.billing_street} onChange={(e) => setField('billing_street', e.target.value)} placeholder="ul. Przykładowa 1/2" />
                </div>
                <div>
                    <Label htmlFor="billing_postal_code">Kod pocztowy</Label>
                    <Input id="billing_postal_code" value={form.billing_postal_code} onChange={(e) => setField('billing_postal_code', e.target.value)} placeholder="00-000" />
                </div>
                <div>
                    <Label htmlFor="billing_city">Miasto</Label>
                    <Input id="billing_city" value={form.billing_city} onChange={(e) => setField('billing_city', e.target.value)} placeholder="Warszawa" />
                </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : complete ? <Check className="h-4 w-4 mr-2" /> : null}
                {saveLabel || (complete ? 'Zapisz zmiany' : 'Zapisz dane firmy')}
            </Button>
        </div>
    );
}
