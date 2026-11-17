import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import PublicLayout from '@/layouts/PublicLayout';
import HomePage from '@/pages/HomePage';

// Route-level code splitting: the homepage ships in the main bundle, everything else on demand.
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ServicesPage = lazy(() => import('@/pages/ServicesPage'));
const ServiceDetailPage = lazy(() => import('@/pages/ServiceDetailPage'));
const PortfolioPage = lazy(() => import('@/pages/PortfolioPage'));
const PortfolioDetailPage = lazy(() => import('@/pages/PortfolioDetailPage'));
const PartnersPage = lazy(() => import('@/pages/PartnersPage'));
const PartnerDetailPage = lazy(() => import('@/pages/PartnerDetailPage'));
const StoriesPage = lazy(() => import('@/pages/StoriesPage'));
const StoryDetailPage = lazy(() => import('@/pages/StoryDetailPage'));
const GalleryPage = lazy(() => import('@/pages/GalleryPage'));
const CompanyProfilePage = lazy(() => import('@/pages/CompanyProfilePage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const AdminApp = lazy(() => import('@/admin/AdminApp'));

const initialLocale = (window.__KRO__?.locale as string | undefined) === 'en' ? 'en' : 'bn';

export const publicRoutes = [
    { index: true, element: <HomePage /> },
    { path: 'about', element: <AboutPage /> },
    { path: 'services', element: <ServicesPage /> },
    { path: 'services/:slug', element: <ServiceDetailPage /> },
    { path: 'portfolio', element: <PortfolioPage /> },
    { path: 'portfolio/:slug', element: <PortfolioDetailPage /> },
    { path: 'partners', element: <PartnersPage /> },
    { path: 'partners/:slug', element: <PartnerDetailPage /> },
    { path: 'success-stories', element: <StoriesPage /> },
    { path: 'success-stories/:slug', element: <StoryDetailPage /> },
    { path: 'gallery', element: <GalleryPage /> },
    { path: 'company-profile', element: <CompanyProfilePage /> },
    { path: 'contact', element: <ContactPage /> },
    { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter([
    { path: '/', element: <Navigate to={`/${initialLocale}`} replace /> },
    { path: '/admin/*', element: <AdminApp /> },
    { path: '/:locale', element: <PublicLayout />, children: publicRoutes },
]);
