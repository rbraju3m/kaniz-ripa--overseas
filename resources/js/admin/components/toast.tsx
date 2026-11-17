import { CheckCircle2, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Toast = { id: number; tone: 'success' | 'error'; message: string };
const Ctx = createContext<(tone: Toast['tone'], message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const push = useCallback((tone: Toast['tone'], message: string) => {
        const id = Date.now() + Math.random();
        setToasts((t) => [...t, { id, tone, message }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 7000 : 3500);
    }, []);
    return (
        <Ctx.Provider value={push}>
            {children}
            <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
                {toasts.map((t) => (
                    <div key={t.id} role="status" className={cn('pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-lg ring-1 animate-fade-up', t.tone === 'success' ? 'bg-white text-slate-800 ring-slate-200' : 'bg-red-50 text-red-800 ring-red-200')}>
                        {t.tone === 'success' ? <CheckCircle2 className="size-5 shrink-0 text-brand-green-600" /> : <XCircle className="size-5 shrink-0 text-red-600" />}
                        {t.message}
                    </div>
                ))}
            </div>
        </Ctx.Provider>
    );
}

export const useToast = () => useContext(Ctx);
