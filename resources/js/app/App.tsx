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

// The server renders the site payload (settings, menus, logo) into the page;
// seed it so the header/footer render without an extra request.
const boot = window.__KRO__;
if (boot?.site && (boot.locale === 'bn' || boot.locale === 'en')) {
    queryClient.setQueryData(['site', boot.locale, {}], { data: boot.site });
    if (boot.home) queryClient.setQueryData(['home', boot.locale, {}], { data: boot.home });
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Suspense fallback={null}>
                <RouterProvider router={router} />
            </Suspense>
        </QueryClientProvider>
    );
}
