// src/app/(dashboard)/page.tsx
'use client';

import { useAuthStore } from '@/store/auth.store';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';

export default function DashboardDispatcherPage() {
    const { user } = useAuthStore();

    if (!user) {
        // Można tu dodać jakiś loader/spinner
        return <div>Ładowanie...</div>;
    }

    if (user.role === 'employee') {
        return <EmployeeDashboard />;
    }

    // Domyślnie dla admina, super_admina i managera
    return <AdminDashboard />;
}