import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminDashboard() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Panel Główny</h1>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktywni Pracownicy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">+2 w tym miesiącu</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Otwarte Zlecenia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5</div>
                        <p className="text-xs text-muted-foreground">3 w trakcie realizacji</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}