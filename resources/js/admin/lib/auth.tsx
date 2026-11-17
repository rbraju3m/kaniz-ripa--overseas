import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { createContext, useContext, type ReactNode } from 'react';
import { adminApi, csrf } from './http';
import type { AdminUser } from './types';

export const ME_KEY = ['admin', 'me'];

export function useMe() {
    return useQuery({
        queryKey: ME_KEY,
        queryFn: () => adminApi.get<{ data: AdminUser }>('/me').then((r) => r.data),
        retry: (count, error) => !(error instanceof AxiosError && [401, 403, 419].includes(error.response?.status ?? 0)) && count < 1,
        staleTime: 60_000,
    });
}

export function useLogin() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (body: { email: string; password: string; remember: boolean }) => {
            await csrf();
            return adminApi.post<{ data: AdminUser }>('/login', body).then((r) => r.data);
        },
        onSuccess: (user) => qc.setQueryData(ME_KEY, user),
    });
}

export function useLogout() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => adminApi.post('/logout'),
        onSettled: () => {
            qc.clear();
            window.location.assign('/admin/login');
        },
    });
}

const UserCtx = createContext<AdminUser | null>(null);

export function UserProvider({ user, children }: { user: AdminUser; children: ReactNode }) {
    return <UserCtx.Provider value={user}>{children}</UserCtx.Provider>;
}

export function useUser(): AdminUser {
    const user = useContext(UserCtx);
    if (!user) throw new Error('useUser outside UserProvider');
    return user;
}

/** UI-level permission check. The API enforces the same rules server-side. */
export function useCan() {
    const user = useUser();
    return (permission: string) => user.is_super_admin || user.permissions.includes(permission);
}
