import axios, { AxiosError } from 'axios';

/** Same-origin API client. Sanctum session cookies + XSRF token are sent automatically. */
export const api = axios.create({
    baseURL: '/api/v1',
    withCredentials: true,
    withXSRFToken: true,
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
});

export async function getJson<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const { data } = await api.get<T>(url, { params });
    return data;
}

export function isNotFound(error: unknown): boolean {
    return error instanceof AxiosError && error.response?.status === 404;
}

export type ValidationErrors = Record<string, string[]>;

export function validationErrors(error: unknown): ValidationErrors | null {
    if (error instanceof AxiosError && error.response?.status === 422) {
        return (error.response.data as { errors?: ValidationErrors }).errors ?? {};
    }
    return null;
}
