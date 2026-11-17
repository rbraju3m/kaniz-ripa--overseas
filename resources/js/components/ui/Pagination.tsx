import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatNumber } from '@/lib/utils';
import { Button } from './Button';

export function Pagination({ page, lastPage, onChange }: { page: number; lastPage: number; onChange: (page: number) => void }) {
    const { t, locale } = useI18n();
    if (lastPage <= 1) return null;
    return (
        <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-3">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
                <ChevronLeft className="size-4" /> {t.common.previous}
            </Button>
            <span className="text-sm text-slate-600">{t.common.page} {formatNumber(page, locale)} / {formatNumber(lastPage, locale)}</span>
            <Button variant="secondary" size="sm" disabled={page >= lastPage} onClick={() => onChange(page + 1)}>
                {t.common.next} <ChevronRight className="size-4" />
            </Button>
        </nav>
    );
}
