import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCan } from '../lib/auth';
import { adminApi, errorMessage } from '../lib/http';
import type { AdminRecord } from '../lib/types';
import type { ResourceConfig } from '../resources/types';
import { Badge } from './ui';
import { useToast } from './toast';

/** On/off switch in a list row for a boolean field (e.g. a country's "Show on website"). */
export function QuickToggle({ cfg, record, field, onLabel, offLabel, onMessage, offMessage }: {
    cfg: Pick<ResourceConfig, 'key' | 'endpoint' | 'permission'>;
    record: AdminRecord;
    field: string;
    onLabel: string;
    offLabel: string;
    onMessage: string;
    offMessage: string;
}) {
    const can = useCan();
    const qc = useQueryClient();
    const toast = useToast();
    const on = !!record[field];
    const toggle = useMutation({
        mutationFn: (value: boolean) => adminApi.patch(`${cfg.endpoint}/${record.id}/toggle`, { field, value }),
        onSuccess: (_, value) => {
            qc.invalidateQueries({ queryKey: ['admin', cfg.key] });
            qc.invalidateQueries({ queryKey: ['admin', 'reference'] });
            toast('success', value ? onMessage : offMessage);
        },
        onError: (e) => toast('error', errorMessage(e)),
    });

    if (!can(`${cfg.permission}.update`)) return <Badge tone={on ? 'green' : 'gray'}>{on ? onLabel : offLabel}</Badge>;

    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={on ? `${onLabel}. Click to switch off` : `${offLabel}. Click to switch on`}
            disabled={toggle.isPending}
            onClick={(e) => { e.stopPropagation(); toggle.mutate(!on); }}
            className="inline-flex items-center gap-2 rounded-full py-1 pr-1 text-xs font-medium disabled:opacity-60"
        >
            <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${on ? 'bg-brand-green-600' : 'bg-slate-300'}`}>
                <span className={`inline-block size-4 rounded-full bg-white shadow transition ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </span>
            <span className={on ? 'text-brand-green-700' : 'text-slate-500'}>{toggle.isPending ? '…' : on ? onLabel : offLabel}</span>
        </button>
    );
}
