'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { billingApi, stripeApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2, CreditCard, Landmark, Building2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import BrandLogo from '@/components/layout/BrandLogo';
import BillingProfileForm from './BillingProfileForm';
import PlanCards, { Plan } from './PlanCards';

type Method = 'card' | 'transfer' | null;

export default function OnboardingGate() {
    const { user, refreshSession } = useAuthStore();

    const dataComplete = Boolean(user?.companyDataComplete);

    const [method, setMethod] = useState<Method>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isYearly, setIsYearly] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [transferDone, setTransferDone] = useState(false);

    useEffect(() => {
        stripeApi.getPlans().then(setPlans).catch(() => toast.error('Nie udało się pobrać planów'));
    }, []);

    const handleCardCheckout = async (plan: Plan) => {
        if (!user?.company_id) return;
        const priceId = isYearly ? plan.stripe_price_id_yearly : plan.stripe_price_id_monthly;
        if (!priceId) {
            toast.error('Ten plan nie ma skonfigurowanej ceny dla wybranego okresu. Skontaktuj się z nami.');
            return;
        }
        setProcessing(true);
        try {
            const { url } = await stripeApi.createCheckoutSession({
                companyId: user.company_id,
                planId: plan.id,
                priceId,
                successUrl: `${window.location.origin}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/dashboard?canceled=true`,
            });
            if (url) window.location.href = url;
            else {
                toast.error('Nie udało się rozpocząć płatności.');
                setProcessing(false);
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Błąd inicjalizacji płatności');
            setProcessing(false);
        }
    };

    const handleTransfer = async (plan: Plan) => {
        setProcessing(true);
        try {
            const res = await billingApi.selectTransfer(plan.id);
            setTransferDone(true);
            toast.success(res?.message || 'Wybrano płatność przelewem');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Błąd wyboru płatności przelewem');
            setProcessing(false);
        }
    };

    // ----- POTWIERDZENIE PRZELEWU -----
    if (transferDone) {
        return (
            <Shell>
                <Card className="max-w-xl mx-auto text-center">
                    <CardContent className="pt-10 pb-8 px-8 space-y-4">
                        <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-9 w-9 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Dziękujemy!</h2>
                        <p className="text-muted-foreground">
                            Wybrałeś płatność przelewem bankowym. W najbliższym czasie skontaktuje się z Wami nasz
                            <strong> dział finansowy</strong> w celu ustalenia szczegółów płatności i wystawienia faktury.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Możesz już korzystać z aplikacji zgodnie z wybranym planem.
                        </p>
                        <Button className="mt-2" onClick={() => refreshSession()}>
                            Przejdź do aplikacji
                        </Button>
                    </CardContent>
                </Card>
            </Shell>
        );
    }

    return (
        <Shell>
            <div className="max-w-3xl mx-auto text-center mb-10">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Dokończ konfigurację konta</h1>
                <p className="text-muted-foreground text-lg">
                    Aby kontynuować korzystanie z aplikacji, uzupełnij dane firmy oraz wybierz sposób rozliczania:
                    płatność kartą lub przelew bankowy.
                </p>
            </div>

            {/* KROK 1: DANE FIRMY */}
            <Card className="max-w-3xl mx-auto mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        1. Dane firmy do faktur
                        {dataComplete && <Check className="h-5 w-5 text-green-600" />}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <BillingProfileForm complete={dataComplete} onSaved={() => refreshSession()} />
                </CardContent>
            </Card>

            {/* KROK 2: SPOSÓB ROZLICZANIA */}
            <div className={`max-w-3xl mx-auto mb-8 transition-opacity ${dataComplete ? '' : 'opacity-50 pointer-events-none'}`}>
                <h2 className="text-xl font-semibold mb-4 text-center">2. Wybierz sposób rozliczania</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <MethodCard
                        active={method === 'card'}
                        onClick={() => setMethod('card')}
                        icon={<CreditCard className="h-6 w-6" />}
                        title="Płatność kartą"
                        desc="Automatyczne, cykliczne pobranie przez Stripe. Natychmiastowy dostęp."
                    />
                    <MethodCard
                        active={method === 'transfer'}
                        onClick={() => setMethod('transfer')}
                        icon={<Landmark className="h-6 w-6" />}
                        title="Przelew bankowy"
                        desc="Skontaktuje się z Wami dział finansowy. Dostęp od razu, faktura proforma."
                    />
                </div>
            </div>

            {/* KROK 3: PLANY */}
            {dataComplete && method && (
                <div className="max-w-5xl mx-auto pb-10">
                    <h2 className="text-xl font-semibold mb-2 text-center">3. Wybierz plan</h2>
                    <p className="text-center text-sm text-muted-foreground mb-6">
                        {method === 'card'
                            ? 'Po wyborze planu przejdziesz do bezpiecznej płatności Stripe.'
                            : 'Po wyborze planu otrzymasz dostęp, a dział finansowy ustali szczegóły przelewu.'}
                    </p>
                    <PlanCards
                        plans={plans}
                        isYearly={isYearly}
                        onYearlyChange={setIsYearly}
                        processing={processing}
                        onSelect={(plan) => (method === 'card' ? handleCardCheckout(plan) : handleTransfer(plan))}
                        getActionLabel={() => (method === 'card' ? 'Zapłać kartą' : 'Wybierz (przelew)')}
                    />
                </div>
            )}
        </Shell>
    );
}

function Shell({ children }: { children: React.ReactNode }) {
    const logout = useAuthStore((s) => s.logout);
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-100">
            <div className="min-h-full py-8 px-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between mb-8">
                    <BrandLogo variant="sidebar" />
                    <Button variant="ghost" size="sm" onClick={() => logout()}>Wyloguj</Button>
                </div>
                {children}
            </div>
        </div>
    );
}

function MethodCard({
    active,
    onClick,
    icon,
    title,
    desc,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`text-left rounded-xl border-2 p-5 transition-all ${
                active ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
        >
            <div className="flex items-center gap-3 mb-2">
                <div className={`h-11 w-11 rounded-full flex items-center justify-center ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'}`}>
                    {icon}
                </div>
                <span className="font-semibold text-lg">{title}</span>
                {active && <Check className="h-5 w-5 text-primary ml-auto" />}
            </div>
            <p className="text-sm text-muted-foreground">{desc}</p>
        </button>
    );
}
