import { AxiosError } from 'axios';
import { api } from '@/lib/api';

export const adminApi = {
    get: <T,>(url: string, params?: Record<string, unknown>) => api.get<T>(`/admin${url}`, { params }).then((r) => r.data),
    post: <T,>(url: string, body?: unknown) => api.post<T>(`/admin${url}`, body).then((r) => r.data),
    put: <T,>(url: string, body?: unknown) => api.put<T>(`/admin${url}`, body).then((r) => r.data),
    patch: <T,>(url: string, body?: unknown) => api.patch<T>(`/admin${url}`, body).then((r) => r.data),
    delete: (url: string) => api.delete(`/admin${url}`).then((r) => r.data),
    upload: <T,>(url: string, form: FormData) => api.post<T>(`/admin${url}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
};

/** Sanctum: fetch the XSRF cookie before the first state-changing request. */
export const csrf = () => api.get('/sanctum/csrf-cookie', { baseURL: '' });

export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data as { message?: string } | undefined;
        if (error.response?.status === 403) return data?.message && data.message !== 'This action is unauthorized.' ? data.message : 'You do not have permission to do that.';
        if (error.response?.status === 419) return 'Your session expired. Please reload the page.';
        return data?.message || fallback;
    }
    return fallback;
}

export function fieldErrors(error: unknown): Record<string, string> {
    if (error instanceof AxiosError && error.response?.status === 422) {
        const errs = (error.response.data as { errors?: Record<string, string[]> }).errors ?? {};
        return Object.fromEntries(Object.entries(errs).map(([k, v]) => [k, v[0]]));
    }
    return {};
}
