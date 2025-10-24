import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/auth.store';
import { toast } from 'sonner';

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

// Interceptor ODPOWIEDZI (Response) - obsługuje wygaśnięcie sesji
api.interceptors.response.use(
    (response) => {
        // Jeśli odpowiedź jest poprawna, po prostu ją zwróć
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config;

        // ✅ POPRAWKA: Dodano opis błędu
        // @ts-expect-error _retry to niestandardowa właściwość, którą dodajemy do obiektu config
        if (error.response?.status === 401 && !originalRequest._retry) {
            // ✅ POPRAWKA: Dodano opis błędu
            // @ts-expect-error Ustawiamy flagę _retry na niestandardowej właściwości
            originalRequest._retry = true; // Oznaczamy żądanie jako ponawiane
            console.log('Access token wygasł. Próbuję odświeżyć...');

            const { refreshToken, setSession } = useAuthStore.getState();

            if (!refreshToken || !SUPABASE_URL || !SUPABASE_KEY) {
                console.log('Brak refresh tokenu lub konfiguracji Supabase. Wylogowuję.');
                useAuthStore.getState().logout();
                window.location.href = '/'; // Twarde przekierowanie
                return Promise.reject(error);
            }

            try {
                // 1. Spróbuj uzyskać nowy token od Supabase
                const { data } = await axios.post(
                    `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
                    { refresh_token: refreshToken },
                    { headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' } }
                );

                const { access_token, refresh_token: newRefreshToken } = data;

                const oldUser = useAuthStore.getState().user;
                if (oldUser) {
                    setSession(access_token, newRefreshToken, oldUser);
                } else {
                    throw new Error('Brak danych starego użytkownika podczas odświeżania sesji.');
                }

                console.log('Token odświeżony. Ponawiam oryginalne żądanie...');

                // 3. Zaktualizuj nagłówek i ponów oryginalne żądanie
                if (originalRequest) {
                    originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // 4. Jeśli odświeżenie się nie uda
                console.error('Nie udało się odświeżyć tokenu. Wylogowuję.', refreshError);
                useAuthStore.getState().logout();
                window.location.href = '/';
                toast.error('Sesja wygasła', { description: 'Proszę zalogować się ponownie.' });
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);