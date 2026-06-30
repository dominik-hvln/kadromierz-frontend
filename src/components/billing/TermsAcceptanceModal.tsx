'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { billingApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { CURRENT_TERMS_DATE } from '@/lib/terms';

export default function TermsAcceptanceModal() {
    const { refreshSession, logout } = useAuthStore();
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAccept = async () => {
        if (!checked) return;
        setLoading(true);
        try {
            await billingApi.acceptTerms();
            await refreshSession();
            toast.success('Dziękujemy za akceptację regulaminu');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Nie udało się zapisać akceptacji');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
                <div className="p-6 sm:p-8">
                    <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-center mb-2">Aktualizacja regulaminu</h2>
                    <p className="text-muted-foreground text-center mb-6">
                        Zaktualizowaliśmy nasz regulamin korzystania z systemu (wersja z dnia {CURRENT_TERMS_DATE}).
                        Aby kontynuować korzystanie z aplikacji, prosimy o zapoznanie się z nim i jego akceptację.
                    </p>

                    <Link
                        href="/regulamin"
                        target="_blank"
                        className="flex items-center justify-center gap-2 text-primary hover:underline font-medium mb-6"
                    >
                        Przeczytaj regulamin <ExternalLink className="h-4 w-4" />
                    </Link>

                    <label className="flex items-start gap-3 cursor-pointer rounded-lg border p-4 hover:bg-gray-50">
                        <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => setChecked(Boolean(v))}
                            className="mt-0.5"
                        />
                        <span className="text-sm">
                            Oświadczam, że zapoznałem(-am) się z treścią regulaminu i akceptuję jego postanowienia
                            w imieniu reprezentowanej firmy.
                        </span>
                    </label>

                    <Button className="w-full mt-6" disabled={!checked || loading} onClick={handleAccept}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Akceptuję regulamin
                    </Button>

                    <button
                        type="button"
                        onClick={() => logout()}
                        className="w-full mt-3 text-sm text-muted-foreground hover:underline"
                    >
                        Wyloguj się
                    </button>
                </div>
            </div>
        </div>
    );
}
