import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

interface User {
    id: string;
    email: string; // Zakładamy, że user ma email
    first_name: string;
    last_name: string;
    role: 'admin' | 'manager' | 'employee' | 'super_admin';
    modules?: string[]; // ✅ Lista aktywnych modułów
}

interface AuthState {
    token: string | null;
    refreshToken: string | null; // ✅ NOWE POLE
    user: User | null;
    isAuthenticated: boolean;
    isHydrating: boolean;
    setSession: (token: string, refreshToken: string, userProfile: User) => void;
    logout: () => void;
    _setIsHydrating: (status: boolean) => void;
}

const capacitorStorage = {
    getItem: async (name: string): Promise<string | null> => {
        const { value } = await Preferences.get({ key: name });
        return value;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await Preferences.set({ key: name, value });
    },
    removeItem: async (name: string): Promise<void> => {
        await Preferences.remove({ key: name });
    },
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
            isHydrating: true, // 1. Ustawiamy wartość początkową tutaj
            setSession: (token, refreshToken, userProfile) => set({
                token,
                refreshToken,
                user: userProfile,
                isAuthenticated: true
            }),
            logout: () => set({
                token: null,
                refreshToken: null,
                user: null,
                isAuthenticated: false
            }),
            _setIsHydrating: (status) => set({ isHydrating: status }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => capacitorStorage),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state._setIsHydrating(false);
                }
            },
        }
    )
);