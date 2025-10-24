import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth.store';
import {toast} from "sonner";

// Odczytujemy zmienne środowiskowe
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;

export const api = axios.create({
    baseURL: API_URL,
});

// Interceptor ŻĄDANIA (Request) - dołącza token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config;

        // @ts-ignore - dodajemy flagę _retry, aby uniknąć nieskończonej pętli
        if (error.response?.status === 401 && !originalRequest._retry) {
            // @ts-ignore
            originalRequest._retry = true;
            console.log('Access token wygasł. Próbuję odświeżyć...');

            const { refreshToken, setSession } = useAuthStore.getState();

            if (!refreshToken) {
                console.log('Brak refresh tokenu. Wylogowuję.');
                useAuthStore.getState().logout();
                window.location.href = '/';
                return Promise.reject(error);
            }

            try {
                // 1. Spróbuj uzyskać nowy token od Supabase
                const { data } = await axios.post(
                    `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
                    { refresh_token: refreshToken },
                    { headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' } }
                );

                const { access_token, refresh_token: newRefreshToken, user } = data;
                const oldUser = useAuthStore.getState().user;
                setSession(access_token, newRefreshToken, oldUser!); // Używamy starych danych profilu

                console.log('Token odświeżony. Ponawiam oryginalne żądanie...');

                if (originalRequest) {
                    originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('Nie udało się odświeżyć tokenu. Wylogowuję.', refreshError);
                useAuthStore.getState().logout();
                window.location.href = '/'; // Twarde przekierowanie
                toast.error('Sesja wygasła', { description: 'Proszę zalogować się ponownie.' });
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);