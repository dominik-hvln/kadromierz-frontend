'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { superAdminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Check, X, Shield, Calendar, Settings, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export default function CompanyDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [company, setCompany] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [allModules, setAllModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmName, setConfirmName] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [compData, plansData, modsData] = await Promise.all([
                superAdminApi.getCompany(id),
                superAdminApi.getPlans(),
                superAdminApi.getModules()
            ]);
            setCompany(compData);
            setPlans(plansData);
            setAllModules(modsData);
        } catch (error) {
            console.error(error);
            toast.error('Błąd pobierania danych firmy');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignPlan = async (planId: string) => {
        try {
            await superAdminApi.assignPlan(id, planId);
            toast.success('Plan zmieniony pomyślnie');
            fetchData(); // Refresh to show new limits/modules
        } catch (error) {
            toast.error('Błąd zmiany planu');
        }
    };

    const handleDeleteCompany = async () => {
        if (confirmName.trim() !== company.name) {
            toast.error('Wpisana nazwa nie zgadza się z nazwą firmy.');
            return;
        }
        setDeleting(true);
        try {
            const res = await superAdminApi.deleteCompany(id);
            toast.success(res?.message || 'Firma usunięta');
            router.push('/admin/companies');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Błąd usuwania firmy');
            setDeleting(false);
        }
    };

    const handleActivateTransfer = async () => {
        if (!confirm('Potwierdzasz zaksięgowanie wpłaty i aktywację subskrypcji tej firmy?')) return;
        try {
            await superAdminApi.activateTransfer(id);
            toast.success('Subskrypcja aktywowana');
            fetchData();
        } catch (error) {
            toast.error('Błąd aktywacji subskrypcji');
        }
    };

    const handleToggleModule = async (moduleCode: string, currentState: boolean) => {
        try {
            await superAdminApi.toggleModule(id, moduleCode, !currentState);
            toast.success(`Moduł ${!currentState ? 'włączony' : 'wyłączony'}`);
            fetchData();
        } catch (error) {
            toast.error('Błąd zmiany modułu');
        }
    };

    if (loading) return <div>Ładowanie danych firmy...</div>;
    if (!company) return <div>Nie znaleziono firmy.</div>;

    const currentSubscription = company.subscriptions?.[0]; // Assuming one active sub for now
    const activeModuleCodes = company.modules || [];

    return (
        <div className="space-y-8 max-w-5xl">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                    <p className="text-sm text-gray-500 font-mono mt-1">ID: {company.id}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Utworzono: {company.created_at && format(new Date(company.created_at), 'd MMMM yyyy, HH:mm', { locale: pl })}
                    </p>
                </div>
                <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold border border-indigo-100">
                    Status: {currentSubscription?.status || 'Brak subskrypcji'}
                </div>
            </div>

            {/* OCZEKUJĄCY PRZELEW */}
            {currentSubscription?.status === 'pending_transfer' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
                    <div className="text-sm text-amber-800">
                        <div className="font-semibold">Oczekuje na płatność przelewem</div>
                        <div>Firma wybrała rozliczenie przelewem. Po zaksięgowaniu wpłaty aktywuj subskrypcję.</div>
                    </div>
                    <Button onClick={handleActivateTransfer}>Aktywuj (wpłata zaksięgowana)</Button>
                </div>
            )}

            {/* DANE FIRMY DO FAKTUR */}
            {(company.tax_id || company.legal_name) && (
                <div className="p-4 rounded-xl border border-gray-100 bg-white text-sm grid sm:grid-cols-2 gap-x-8 gap-y-1">
                    <div><span className="text-gray-500">Nazwa (faktura): </span>{company.legal_name || '—'}</div>
                    <div><span className="text-gray-500">NIP: </span>{company.tax_id || '—'}</div>
                    <div><span className="text-gray-500">Adres: </span>{[company.billing_street, [company.billing_postal_code, company.billing_city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '—'}</div>
                    <div><span className="text-gray-500">E-mail faktur: </span>{company.billing_email || '—'}</div>
                    <div><span className="text-gray-500">Metoda płatności: </span>{company.billing_type === 'card' ? 'Karta (Stripe)' : company.billing_type === 'transfer' ? 'Przelew' : '—'}</div>
                    <div><span className="text-gray-500">Regulamin (wersja): </span>{company.accepted_terms_version || 'niezaakceptowany'}</div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
                {/* SUBSKRYPCJA I PLAN */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <Shield className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-semibold">Zarządzanie Planem</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-500 mb-1">Obecny Plan</div>
                            <div className="text-xl font-bold text-gray-900">
                                {plans.find(p => p.id === currentSubscription?.plan_id)?.name || 'Brak przypisanego planu'}
                            </div>
                            {currentSubscription?.trial_end && (
                                <div className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Okres próbny do: {format(new Date(currentSubscription.trial_end), 'd MMM yyyy')}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Zmień Pakiet</label>
                            <div className="grid grid-cols-1 gap-2">
                                {plans.map((plan) => (
                                    <button
                                        key={plan.id}
                                        onClick={() => handleAssignPlan(plan.id)}
                                        disabled={currentSubscription?.plan_id === plan.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${currentSubscription?.plan_id === plan.id
                                                ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                                                : 'hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div>
                                            <div className="font-semibold text-gray-900">{plan.name}</div>
                                            <div className="text-xs text-gray-500">{plan.price_monthly} zł/mc</div>
                                        </div>
                                        {currentSubscription?.plan_id === plan.id && <Check className="w-5 h-5 text-indigo-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODUŁY */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-semibold">Konfiguracja Modułów</h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Możesz ręcznie włączyć/wyłączyć moduły dla tej firmy, niezależnie od wybranego planu (tzw. override).
                        </p>

                        <div className="divide-y">
                            {allModules.map((mod) => {
                                const isEnabled = activeModuleCodes.includes(mod.code);
                                return (
                                    <div key={mod.code} className="py-4 flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-gray-900">{mod.name}</div>
                                            <div className="text-xs text-gray-500">{mod.description}</div>
                                        </div>
                                        <button
                                            onClick={() => handleToggleModule(mod.code, isEnabled)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* STREFA NIEBEZPIECZNA */}
            <div className="bg-white p-6 rounded-xl border-2 border-red-200">
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-red-700">Strefa niebezpieczna</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Trwałe usunięcie firmy skasuje <strong>wszystkich pracowników</strong> (konta logowania) oraz
                    wszystkie dane firmy: ewidencję czasu, grafiki, nieobecności, projekty, raporty, subskrypcję itd.
                    Tej operacji <strong>nie można cofnąć</strong>.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aby potwierdzić, wpisz nazwę firmy: <span className="font-mono text-gray-900">{company.name}</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                    <Input
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        placeholder="Nazwa firmy"
                        disabled={deleting}
                    />
                    <Button
                        variant="destructive"
                        onClick={handleDeleteCompany}
                        disabled={deleting || confirmName.trim() !== company.name}
                    >
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Usuń firmę na zawsze
                    </Button>
                </div>
            </div>
        </div>
    );
}
