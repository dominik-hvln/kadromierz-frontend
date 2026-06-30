'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Loader2 } from 'lucide-react';

export interface Plan {
    id: string;
    name: string;
    code?: string;
    price_monthly: number;
    price_yearly: number;
    stripe_price_id_monthly?: string | null;
    stripe_price_id_yearly?: string | null;
    limits?: Record<string, number> | null;
    modules?: { code: string; name: string; description?: string }[];
}

// Czytelne etykiety znanych limitów
const LIMIT_LABELS: Record<string, string> = {
    users: 'Liczba pracowników',
    employees: 'Liczba pracowników',
    projects: 'Liczba projektów',
    locations: 'Liczba lokalizacji',
};

function limitLabel(key: string) {
    return LIMIT_LABELS[key] || key;
}

interface Props {
    plans: Plan[];
    isYearly: boolean;
    onYearlyChange: (v: boolean) => void;
    onSelect: (plan: Plan) => void;
    getActionLabel: (plan: Plan) => string;
    processing?: boolean;
    currentPlanId?: string | null;
    disableCurrent?: boolean;
}

export default function PlanCards({
    plans,
    isYearly,
    onYearlyChange,
    onSelect,
    getActionLabel,
    processing,
    currentPlanId,
    disableCurrent,
}: Props) {
    return (
        <div>
            <div className="flex justify-center items-center space-x-4 mb-8">
                <Label className={`cursor-pointer ${!isYearly ? 'font-bold' : ''}`}>Miesięcznie</Label>
                <Switch checked={isYearly} onCheckedChange={onYearlyChange} />
                <Label className={`cursor-pointer ${isYearly ? 'font-bold' : ''}`}>
                    Rocznie <span className="text-xs text-green-600 font-normal ml-1">(taniej)</span>
                </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const price = isYearly ? plan.price_yearly : plan.price_monthly;
                    const isCurrent = !!currentPlanId && plan.id === currentPlanId;
                    const limits = plan.limits ? Object.entries(plan.limits) : [];

                    return (
                        <Card key={plan.id} className={`flex flex-col ${isCurrent ? 'ring-2 ring-primary shadow-lg' : ''}`}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    {plan.name}
                                    {isCurrent && <Badge>Obecny</Badge>}
                                </CardTitle>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold">{price} PLN</span>
                                    <span className="text-muted-foreground"> / {isYearly ? 'rok' : 'mc'}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-2 mt-2 text-sm">
                                    {(plan.modules || []).map((m) => (
                                        <li key={m.code} className="flex items-center">
                                            <Check className="h-4 w-4 mr-2 text-green-500 shrink-0" />
                                            {m.name}
                                        </li>
                                    ))}
                                    {limits.map(([key, val]) => (
                                        <li key={key} className="flex items-center">
                                            <Check className="h-4 w-4 mr-2 text-green-500 shrink-0" />
                                            {limitLabel(key)}: <strong className="ml-1">{val === -1 ? 'bez limitu' : String(val)}</strong>
                                        </li>
                                    ))}
                                    {(plan.modules || []).length === 0 && limits.length === 0 && (
                                        <li className="text-muted-foreground">Funkcje podstawowe</li>
                                    )}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={isCurrent ? 'outline' : 'default'}
                                    disabled={processing || (disableCurrent && isCurrent)}
                                    onClick={() => onSelect(plan)}
                                >
                                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : getActionLabel(plan)}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
