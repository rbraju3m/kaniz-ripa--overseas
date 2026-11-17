import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'kro-theme';

/** Saved choice, else the visitor's system preference. Storage can be unavailable (private mode). */
function initialTheme(): Theme {
    try {
        const saved = localStorage.getItem(KEY);
        if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* ignore */ }
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} });

/** Public website theme only (the admin keeps its own light UI). */
export function ThemeProvider({ children }: { children: (theme: Theme) => ReactNode }) {
    const [theme, setTheme] = useState<Theme>(initialTheme);
    useEffect(() => {
        document.documentElement.style.colorScheme = theme;
        document.documentElement.classList.toggle('site-dark-boot', theme === 'dark');
        return () => { document.documentElement.style.colorScheme = ''; document.documentElement.classList.remove('site-dark-boot'); };
    }, [theme]);
    const toggle = useCallback(() => setTheme((t) => {
        const next = t === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
        return next;
    }), []);
    return <ThemeContext.Provider value={{ theme, toggle }}>{children(theme)}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
