import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { isNotFound } from '@/lib/api';
import { router } from './router';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: (count, error) => !isNotFound(error) && count < 2,
        },
    },
});

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Suspense fallback={null}>
                <RouterProvider router={router} />
            </Suspense>
        </QueryClientProvider>
    );
}
