export default function AdminDashboardPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-500">Wszystkie Firmy</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">12</div>
                    <div className="text-xs text-green-600 mt-1">+2 w tym miesiącu</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-500">Aktywne Subskrypcje</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">8</div>
                    <div className="text-xs text-indigo-600 mt-1">66% konwersji</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-500">Przychód MRR</div>
                    <div className="mt-2 text-3xl font-bold text-gray-900">4 200 PLN</div>
                    <div className="text-xs text-green-600 mt-1">+12% wzrostu</div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64 flex items-center justify-center text-gray-400">
                    Wykres Przyrostu Firm (Placeholder)
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64 flex items-center justify-center text-gray-400">
                    Ostatnie Logowania (Placeholder)
                </div>
            </div>
        </div>
    );
}
