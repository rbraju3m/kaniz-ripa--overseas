import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactForm } from '@/components/contact/ContactForm';
import { api } from '@/lib/api';
import { I18nProvider } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

function renderForm(locale: Locale = 'en') {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    return render(
        <QueryClientProvider client={client}>
            <I18nProvider locale={locale}><ContactForm /></I18nProvider>
        </QueryClientProvider>,
    );
}

describe('ContactForm', () => {
    beforeEach(() => vi.restoreAllMocks());

    it('validates required fields and needs email or phone', async () => {
        const post = vi.spyOn(api, 'post');
        renderForm();
        await userEvent.type(screen.getByLabelText('Your name'), 'Karim');
        await userEvent.type(screen.getByLabelText('Message'), 'short');
        await userEvent.click(screen.getByRole('button', { name: /send message/i }));

        expect(await screen.findByText('Please provide an email address or a phone number.')).toBeInTheDocument();
        expect(screen.getByText('Please write at least 10 characters.')).toBeInTheDocument();
        expect(post).not.toHaveBeenCalled();
    });

    it('submits valid data with the current locale and shows success', async () => {
        const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
        renderForm('bn');
        await userEvent.type(screen.getByLabelText('আপনার নাম'), 'রহিম');
        await userEvent.type(screen.getByLabelText('ফোন'), '01700000000');
        await userEvent.type(screen.getByLabelText('বার্তা'), 'আমি আপনাদের সেবা সম্পর্কে জানতে চাই।');
        await userEvent.click(screen.getByRole('button', { name: /বার্তা পাঠান/ }));

        await waitFor(() => expect(post).toHaveBeenCalledOnce());
        expect(post.mock.calls[0][0]).toBe('/contact');
        expect(post.mock.calls[0][2]).toEqual({ params: { locale: 'bn' } });
        expect(await screen.findByRole('status')).toHaveTextContent('ধন্যবাদ');
    });

    it('shows server-side validation errors', async () => {
        const { AxiosError } = await import('axios');
        const error = new AxiosError('422', '422', undefined, undefined, {
            status: 422, data: { errors: { email: ['Server says no.'] } },
        } as never);
        vi.spyOn(api, 'post').mockRejectedValue(error);
        renderForm();
        await userEvent.type(screen.getByLabelText('Your name'), 'Karim');
        await userEvent.type(screen.getByLabelText('Email'), 'k@example.com');
        await userEvent.type(screen.getByLabelText('Message'), 'Please call me back soon.');
        await userEvent.click(screen.getByRole('button', { name: /send message/i }));

        expect(await screen.findByText('Server says no.')).toBeInTheDocument();
    });
});
