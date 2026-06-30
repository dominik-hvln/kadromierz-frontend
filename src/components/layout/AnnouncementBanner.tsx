'use client';

import { useEffect, useState } from 'react';
import { billingApi } from '@/lib/api';
import { Megaphone, X } from 'lucide-react';

export default function AnnouncementBanner() {
    const [text, setText] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        billingApi
            .getPublicSettings()
            .then((s) => setText(s?.announcement || null))
            .catch(() => {});
    }, []);

    if (!text || dismissed) return null;

    return (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
            <Megaphone className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="flex-1 whitespace-pre-line">{text}</p>
            <button onClick={() => setDismissed(true)} className="text-indigo-400 hover:text-indigo-700" aria-label="Zamknij">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
