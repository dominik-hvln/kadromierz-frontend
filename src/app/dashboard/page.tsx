// src/app/(dashboard)/page.tsx
'use client';

import { useAuthStore } from '@/store/auth.store';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardDispatcherPage() {
    const { user } = useAuthStore();

    if (!user) {
        return (
            <DashboardLayout>
                <div>Ładowanie...</div>
            </DashboardLayout>
        )
    }

    if (user.role === 'employee') {
        return (
            <DashboardLayout>
                <EmployeeDashboard />
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <AdminDashboard />
        </DashboardLayout>
    )
}