import type { ReactNode } from 'react';
import type { AdminRecord, ReferenceData } from '../lib/types';

export type RefKey = keyof ReferenceData;
export interface Option { value: string | number; label: string }

interface Base {
    name: string;
    label: string;
    help?: ReactNode;
    required?: boolean;
    /** Where the field renders in the form. */
    placement?: 'main' | 'side';
    /** Only editable when creating (e.g. page key). */
    createOnly?: boolean;
}

export type FieldDef = Base & (
    | { type: 'text' | 'textarea' | 'richtext' | 'number' | 'date' | 'url' }
    | { type: 'slug'; from: string }
    | { type: 'select'; options?: Option[]; ref?: RefKey; nullable?: boolean }
    | { type: 'switch'; description?: ReactNode }
    | { type: 'media'; relation: string; folder?: string; aspect?: string }
    | { type: 'gallery'; folder?: string }
    | { type: 'localized'; inputType?: 'text' | 'textarea' } // JSON {bn,en} column (not a translation table)
    | { type: 'sections' }
);

export interface ColumnDef {
    label: string;
    render: (record: AdminRecord, ctx: { ref?: ReferenceData }) => ReactNode;
    className?: string;
}

export interface ResourceConfig {
    key: string;
    endpoint: string;
    permission: string;
    singular: string;
    plural: string;
    description?: ReactNode;
    publishable?: boolean;
    translatable?: boolean;
    /** New translations start as "reviewed" (simple data such as names). */
    reviewedByDefault?: boolean;
    searchable?: boolean;
    fields: FieldDef[];
    translationFields?: FieldDef[];
    columns: ColumnDef[];
    filters?: { name: string; label: string; options?: Option[]; ref?: RefKey }[];
    defaults?: Record<string, unknown>;
    /** Extra notes in the form sidebar (e.g. consent rules). */
    sideNote?: ReactNode;
    /** Adjust API payload before saving. */
    toPayload?: (payload: Record<string, unknown>, values: Record<string, unknown>) => Record<string, unknown>;
    /** Adjust form values after loading a record. */
    fromRecord?: (values: Record<string, unknown>, record: AdminRecord) => Record<string, unknown>;
    titleOf?: (record: AdminRecord) => string;
}
