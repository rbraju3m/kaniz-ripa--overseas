import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, RemoveFormatting, Unlink, type LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type Tool = { label: string; icon: LucideIcon; command: string; arg?: string };

const TOOLS: Tool[] = [
    { label: 'Bold', icon: Bold, command: 'bold' },
    { label: 'Italic', icon: Italic, command: 'italic' },
    { label: 'Heading', icon: Heading2, command: 'formatBlock', arg: '<h2>' },
    { label: 'Subheading', icon: Heading3, command: 'formatBlock', arg: '<h3>' },
    { label: 'Bulleted list', icon: List, command: 'insertUnorderedList' },
    { label: 'Numbered list', icon: ListOrdered, command: 'insertOrderedList' },
    { label: 'Quote', icon: Quote, command: 'formatBlock', arg: '<blockquote>' },
    { label: 'Link', icon: Link2, command: 'link' },
    { label: 'Remove link', icon: Unlink, command: 'unlink' },
    { label: 'Clear formatting', icon: RemoveFormatting, command: 'clear' },
];

/**
 * Lightweight rich-text editor (contentEditable). Output is HTML that the
 * server sanitises with HTMLPurifier on save, so nothing here is trusted.
 */
export function RichText({ value, onChange, lang, invalid, minHeight = 'min-h-48' }: { value: string; onChange: (html: string) => void; lang?: string; invalid?: boolean; minHeight?: string }) {
    const ref = useRef<HTMLDivElement>(null);

    // Only push external value changes into the DOM (keeps the caret stable while typing).
    useEffect(() => {
        if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || '';
    }, [value]);

    const exec = (command: string, arg?: string) => {
        ref.current?.focus();
        document.execCommand(command, false, arg);
        onChange(ref.current?.innerHTML ?? '');
    };

    const run = (tool: Tool) => {
        if (tool.command === 'link') {
            const url = window.prompt('Link URL (https://…)');
            if (url && /^(https?:\/\/|mailto:|tel:|\/)/.test(url)) exec('createLink', url);
            return;
        }
        if (tool.command === 'clear') {
            exec('removeFormat');
            exec('formatBlock', '<p>');
            return;
        }
        exec(tool.command, tool.arg);
    };

    return (
        <div className={cn('overflow-hidden rounded-lg bg-white shadow-sm ring-1 focus-within:ring-2 focus-within:ring-navy-600', invalid ? 'ring-red-400' : 'ring-slate-300')}>
            <div className="flex flex-wrap gap-0.5 border-b border-slate-200 bg-slate-50 p-1">
                {TOOLS.map((t) => (
                    <button key={t.label} type="button" title={t.label} aria-label={t.label} onMouseDown={(e) => e.preventDefault()} onClick={() => run(t)}
                        className="rounded p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900">
                        <t.icon className="size-4" />
                    </button>
                ))}
            </div>
            <div
                ref={ref}
                lang={lang}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
                onPaste={(e) => {
                    // Paste as plain text to avoid foreign styles/markup.
                    e.preventDefault();
                    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
                }}
                className={cn('prose-content max-w-none px-3 py-2 text-sm outline-none', minHeight)}
            />
        </div>
    );
}
