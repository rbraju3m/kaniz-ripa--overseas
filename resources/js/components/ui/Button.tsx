import { Link } from 'react-router';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'light' | 'gold';
type Size = 'sm' | 'md' | 'lg';

const base = 'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60';
const variants: Record<Variant, string> = {
    primary: 'bg-brand-green-700 text-white shadow-soft hover:bg-brand-green-800 hover:shadow-lift focus-visible:outline-brand-green-700',
    secondary: 'bg-white text-navy-900 ring-1 ring-navy-200 hover:ring-navy-400 hover:bg-navy-50',
    ghost: 'text-navy-800 hover:bg-navy-50',
    light: 'bg-white/10 text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/20',
    gold: 'bg-gold-500 text-navy-950 hover:bg-gold-300 shadow-soft',
};
const sizes: Record<Size, string> = { sm: 'h-9 px-4 text-sm', md: 'h-11 px-5 text-sm', lg: 'h-12 px-6 text-base' };

interface Common { variant?: Variant; size?: Size; className?: string; children: ReactNode }

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', className?: string) =>
    cn(base, variants[variant], sizes[size], className);

export function Button({ variant, size, className, ...props }: Common & ComponentProps<'button'>) {
    return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: Common & ComponentProps<typeof Link>) {
    return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonAnchor({ variant, size, className, ...props }: Common & ComponentProps<'a'>) {
    return <a className={buttonClass(variant, size, className)} {...props} />;
}
