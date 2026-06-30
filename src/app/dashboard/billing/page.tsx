'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { stripeApi, billingApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Building2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import BillingProfileForm from '@/components/billing/BillingProfileForm';
import PlanCards, { Plan } from '@/components/billing/PlanCards';

export default function SubscriptionPage() {
    const { user, refreshSession } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const [subscription, setSubscription] = useState<any>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isYearly, setIsYearly] = useState(false);
    const [editingData, setEditingData] = useState(false);

    const companyDataComplete = Boolean(user?.companyDataComplete);
    const billingType = user?.company?.billing_type;

    useEffect(() => {
        if (user && user.role !== 'admin' && user.role !== 'manager') {
            toast.error('Brak uprawnień. Sekcja dostępna tylko dla administratorów i managerów firmy.');
            router.push('/dashboard');
            return;
        }
        fetchData();
    }, [user, router]);

    const fetchData = async () => {
        try {
            const searchParams = new URLSearchParams(window.location.search);
            const success = searchParams.get('success');
            const sessionId = searchParams.get('session_id');

            if (success && sessionId) {
                toast.info('Weryfikacja płatności...');
                try {
                    await stripeApi.verifySession(sessionId);
                    await refreshSession();
                    toast.success('Płatność potwierdzona!');
                    window.history.replaceState({}, '', '/dashboard/billing');
                } catch (e: any) {
                    const msg = e.response?.data?.message || e.message || 'Błąd weryfikacji';
                    toast.warning(`Błąd weryfikacji: ${msg}`);
                }
            }

            const [subData, plansData] = await Promise.all([
                stripeApi.getSubscription(),
                stripeApi.getPlans(),
            ]);
            setSubscription(subData);
            setPlans(plansData);
        } catch (error) {
            console.error(error);
            toast.error('Nie udało się pobrać danych subskrypcji');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = async (plan: Plan) => {
        if (!user?.company_id) return;

        // Wymóg: dane firmy muszą być uzupełnione przed wyborem/zmianą planu
        if (!companyDataComplete) {
            toast.error('Najpierw uzupełnij dane firmy do faktur.');
            setEditingData(true);
            document.getElementById('company-data-section')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        // Klient rozliczający się przelewem zmienia plan również przelewem
        if (billingType === 'transfer') {
            setProcessing(true);
            try {
                const res = await billingApi.selectTransfer(plan.id);
                await refreshSession();
                toast.success(res?.message || 'Zapisano wybór planu (przelew)');
                fetchData();
            } catch (e: any) {
                toast.error(e?.response?.data?.message || 'Błąd zmiany planu');
            } finally {
                setProcessing(false);
            }
            return;
        }

        // Płatność kartą (Stripe)
        const priceId = isYearly ? plan.stripe_price_id_yearly : plan.stripe_price_id_monthly;
        if (!priceId) {
            toast.error('Ten plan nie ma skonfigurowanej ceny dla wybranego okresu.');
            return;
        }
        setProcessing(true);
        try {
            const { url } = await stripeApi.createCheckoutSession({
                companyId: user.company_id,
                planId: plan.id,
                priceId,
                successUrl: `${window.location.origin}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/dashboard/billing?canceled=true`,
            });
            if (url) window.location.href = url;
            else {
                toast.error('Nie udało się rozpocząć płatności.');
                setProcessing(false);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Błąd inicjalizacji płatności');
            setProcessing(false);
        }
    };

    const handlePortal = async () => {
        setProcessing(true);
        try {
            const { url } = await stripeApi.createPortalSession(window.location.href);
            if (url) window.location.href = url;
            else {
                toast.error('Panel klienta niedostępny.');
                setProcessing(false);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Błąd otwierania panelu klienta');
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    const planObj = subscription?.plans || subscription?.plan;
    const currentPlanId = planObj?.id || subscription?.plan_id;
    const status = subscription?.status;
    const isActive = status === 'active';
    const isTrialing = status === 'trialing';
    const isPendingTransfer = status === 'pending_transfer';

    return (
        <div className="container py-10 max-w-5xl">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Twoja Subskrypcja</h1>
                <p className="text-muted-foreground">Zarządzaj danymi firmy, planem i płatnościami</p>
            </div>

            {/* STATUS */}
            <div className="mb-8">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Obecny Status</span>
                            {isActive ? (
                                <Badge className="bg-green-600 hover:bg-green-700">Aktywna</Badge>
                            ) : isTrialing ? (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Okres Próbny</Badge>
                            ) : isPendingTransfer ? (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700">Oczekuje na przelew</Badge>
                            ) : (
                                <Badge variant="destructive">Nieaktywna</Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {planObj ? `Korzystasz z planu: ${planObj.name}` : 'Brak aktywnego planu'}
                            {billingType && (
                                <span className="ml-2">· Metoda: {billingType === 'card' ? 'karta (Stripe)' : 'przelew bankowy'}</span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isPendingTransfer && (
                            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>Wybrałeś płatność przelewem. Dział finansowy skontaktuje się w sprawie wpłaty i faktury. Dostęp do aplikacji masz już teraz.</span>
                            </div>
                        )}
                        {subscription?.current_period_end && (
                            <p className="text-sm">
                                Data odnowienia/wygaśnięcia: <strong>{new Date(subscription.current_period_end).toLocaleDateString()}</strong>
                            </p>
                        )}
                    </CardContent>
                    {billingType === 'card' && (
                        <CardFooter>
                            <Button onClick={handlePortal} variant="outline" disabled={processing} className="w-full sm:w-auto">
                                <CreditCard className="mr-2 h-4 w-4" />
                                Zarządzaj kartą i fakturami (Stripe)
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>

            {/* DANE FIRMY */}
            <div id="company-data-section" className="mb-10">
                <Card className={!companyDataComplete ? 'border-amber-300' : ''}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Building2 className="h-5 w-5 text-primary" />
                            Dane firmy do faktur
                            {companyDataComplete ? (
                                <Check className="h-5 w-5 text-green-600" />
                            ) : (
                                <Badge variant="destructive" className="ml-2">Wymagane</Badge>
                            )}
                        </CardTitle>
                        {!companyDataComplete && (
                            <CardDescription className="text-amber-700">
                                Uzupełnij dane firmy (nazwa, NIP, adres, e-mail), aby móc wybrać i opłacić plan.
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent>
                        {(!companyDataComplete || editingData) ? (
                            <BillingProfileForm
                                complete={companyDataComplete}
                                onSaved={() => setEditingData(false)}
                            />
                        ) : (
                            <div className="text-sm grid sm:grid-cols-2 gap-x-8 gap-y-1">
                                <div><span className="text-muted-foreground">Nazwa: </span>{user?.company?.legal_name}</div>
                                <div><span className="text-muted-foreground">NIP: </span>{user?.company?.tax_id}</div>
                                <div><span className="text-muted-foreground">Adres: </span>{user?.company?.billing_street}, {user?.company?.billing_postal_code} {user?.company?.billing_city}</div>
                                <div><span className="text-muted-foreground">E-mail faktur: </span>{user?.company?.billing_email}</div>
                                <div className="sm:col-span-2 pt-2">
                                    <Button variant="outline" size="sm" onClick={() => setEditingData(true)}>Edytuj dane firmy</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* PLANY */}
            <h2 className="text-xl font-semibold mb-2 text-center">Dostępne plany</h2>
            <p className="text-center text-sm text-muted-foreground mb-6">
                {billingType === 'transfer'
                    ? 'Zmiana planu zostanie rozliczona przelewem — dział finansowy ustali szczegóły.'
                    : 'Wybór planu przekieruje do bezpiecznej płatności Stripe.'}
            </p>
            <PlanCards
                plans={plans}
                isYearly={isYearly}
                onYearlyChange={setIsYearly}
                processing={processing}
                currentPlanId={currentPlanId}
                disableCurrent
                onSelect={handleSelectPlan}
                getActionLabel={(plan) =>
                    plan.id === currentPlanId
                        ? 'Twój obecny plan'
                        : billingType === 'transfer'
                            ? 'Wybierz (przelew)'
                            : 'Wybierz plan'
                }
            />
        </div>
    );
}
