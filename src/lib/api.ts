import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const API_URL = 'https://aplikacja-czasu-pracy-backend.onrender.com';

export const api = axios.create({
    baseURL: API_URL,
});

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