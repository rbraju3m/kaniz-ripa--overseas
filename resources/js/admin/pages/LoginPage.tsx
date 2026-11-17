import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { Btn, Field, Input } from '../components/ui';
import { useLogin, useMe } from '../lib/auth';
import { fieldErrors } from '../lib/http';

const schema = z.object({
    email: z.email('Enter a valid email address.'),
    password: z.string().min(1, 'Enter your password.'),
    remember: z.boolean(),
});

export default function LoginPage() {
    const me = useMe();
    const login = useLogin();
    const navigate = useNavigate();
    const from = (useLocation().state as { from?: string } | null)?.from ?? '/admin';
    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '', remember: false } });

    if (me.data) return <Navigate to={from} replace />;

    const err = login.error;
    const message = err instanceof AxiosError && err.response?.status === 429
        ? 'Too many attempts. Please wait a minute and try again.'
        : fieldErrors(err).email ?? (login.isError ? 'Sign-in failed. Please try again.' : null);

    return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-900 to-navy-950 p-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center text-white">
                    <p className="font-display text-lg font-extrabold tracking-[0.14em]">KANIZ RIPA</p>
                    <p className="font-display text-xs font-semibold tracking-[0.32em] text-gold-300">OVERSEAS · CMS</p>
                </div>
                <form onSubmit={handleSubmit((v) => login.mutate(v, { onSuccess: () => navigate(from, { replace: true }) }))} noValidate className="space-y-5 rounded-2xl bg-white p-8 shadow-xl">
                    <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><Lock className="size-5 text-navy-700" /> Sign in</h1>
                    {message && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}
                    <Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="username" autoFocus {...register('email')} /></Field>
                    <Field label="Password" error={errors.password?.message}><Input type="password" autoComplete="current-password" {...register('password')} /></Field>
                    <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" className="rounded" {...register('remember')} /> Keep me signed in</label>
                    <Btn type="submit" className="w-full" loading={login.isPending}>Sign in</Btn>
                </form>
                <p className="mt-6 text-center text-xs text-navy-300"><a href="/" className="hover:text-white">← Back to website</a></p>
            </div>
        </main>
    );
}
