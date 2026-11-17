import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Locale } from './types';

type Slugs = Partial<Record<Locale, string>> | null;

const Ctx = createContext<{ slugs: Slugs; setSlugs: (s: Slugs) => void }>({ slugs: null, setSlugs: () => {} });

/** Lets detail pages tell the language switcher their slug in each locale. */
export function AlternatesProvider({ children }: { children: ReactNode }) {
    const [slugs, setSlugs] = useState<Slugs>(null);
    return <Ctx.Provider value={{ slugs, setSlugs }}>{children}</Ctx.Provider>;
}

export const useAlternateSlugs = () => useContext(Ctx).slugs;

export function usePublishAlternates(slugs: Slugs | undefined) {
    const { setSlugs } = useContext(Ctx);
    const key = JSON.stringify(slugs ?? null);
    useEffect(() => {
        setSlugs(slugs ?? null);
        return () => setSlugs(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, setSlugs]);
}
