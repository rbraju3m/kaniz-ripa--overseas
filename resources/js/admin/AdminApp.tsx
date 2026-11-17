import { AxiosError } from 'axios';
import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import AdminLayout from './components/AdminLayout';
import { ToastProvider } from './components/toast';
import { Spinner } from './components/ui';
import { UserProvider, useCan, useMe } from './lib/auth';
import { RESOURCES } from './resources/configs';
import type { ResourceConfig } from './resources/types';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ResourceList = lazy(() => import('./pages/ResourceList'));
const ResourceForm = lazy(() => import('./pages/ResourceForm'));
const MediaLibraryPage = lazy(() => import('./pages/MediaLibraryPage'));
const CompanyProfilePage = lazy(() => import('./pages/CompanyProfilePage'));
const ContactMessagesPage = lazy(() => import('./pages/ContactMessagesPage'));
const MenusPage = lazy(() => import('./pages/MenusPage'));
const SeoPage = lazy(() => import('./pages/SeoPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const RolesPage = lazy(() => import('./pages/RolesPage'));
const ActivityLogPage = lazy(() => import('./pages/ActivityLogPage'));

const Loading = () => <div className="grid min-h-[50vh] place-items-center"><Spinner /></div>;

/** Hides a screen the user has no permission for (the API enforces it as well). */
function Guard({ perm, children }: { perm: string; children: React.ReactNode }) {
    const can = useCan();
    return can(perm) ? <>{children}</> : <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-600 ring-1 ring-slate-200">You don't have permission to view this section.</div>;
}

function Protected() {
    const me = useMe();
    const location = useLocation();
    if (me.isLoading) return <Loading />;
    const unauth = me.error instanceof AxiosError && [401, 403, 419].includes(me.error.response?.status ?? 0);
    if (unauth || !me.data) return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;

    const resource = (cfg: ResourceConfig) => [
        <Route key={`${cfg.key}-list`} path={cfg.key} element={<Guard perm={`${cfg.permission}.view`}><ResourceList key={cfg.key} cfg={cfg} /></Guard>} />,
        <Route key={`${cfg.key}-form`} path={`${cfg.key}/:id`} element={<Guard perm={`${cfg.permission}.view`}><ResourceForm key={cfg.key} cfg={cfg} /></Guard>} />,
    ];

    return (
        <UserProvider user={me.data}>
            <Routes>
                <Route element={<AdminLayout />}>
                    <Route index element={<Guard perm="dashboard.view"><DashboardPage /></Guard>} />
                    {RESOURCES.flatMap(resource)}
                    <Route path="media" element={<Guard perm="media.view"><MediaLibraryPage /></Guard>} />
                    <Route path="company-profile" element={<Guard perm="company_profile.view"><CompanyProfilePage /></Guard>} />
                    <Route path="contact-messages" element={<Guard perm="contact_messages.view"><ContactMessagesPage /></Guard>} />
                    <Route path="menus" element={<Guard perm="menus.view"><MenusPage /></Guard>} />
                    <Route path="seo" element={<Guard perm="seo.view"><SeoPage /></Guard>} />
                    <Route path="settings" element={<Guard perm="settings.view"><SettingsPage /></Guard>} />
                    <Route path="users" element={<Guard perm="users.view"><UsersPage /></Guard>} />
                    <Route path="roles" element={<Guard perm="roles.view"><RolesPage /></Guard>} />
                    <Route path="activity-logs" element={<Guard perm="activity_logs.view"><ActivityLogPage /></Guard>} />
                    <Route path="*" element={<div className="py-24 text-center text-slate-500">Page not found.</div>} />
                </Route>
            </Routes>
        </UserProvider>
    );
}

export default function AdminApp() {
    useEffect(() => {
        document.documentElement.lang = 'en';
        document.title = 'CMS | Kaniz Ripa Overseas';
    }, []);

    return (
        <ToastProvider>
            <Suspense fallback={<Loading />}>
                <Routes>
                    <Route path="login" element={<LoginPage />} />
                    <Route path="*" element={<Protected />} />
                </Routes>
            </Suspense>
        </ToastProvider>
    );
}
