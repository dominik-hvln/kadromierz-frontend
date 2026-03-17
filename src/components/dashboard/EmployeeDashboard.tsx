'use client';

import { TimeTrackerWidget } from './TimeTrackerWidget';

export function EmployeeDashboard() {
    return (
        <div className="flex justify-center p-4 pt-12 md:pt-4">
            <div className="w-full max-w-md">
                <TimeTrackerWidget />
            </div>
        </div>
    );
}

export default EmployeeDashboard;
