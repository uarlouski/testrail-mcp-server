export interface Case {
    id: number;
    title: string;
    section_id: number;
    template_id: number;
    type_id: number;
    priority_id: number;
    milestone_id: number | null;
    refs: string | null;
    created_by: number;
    created_on: number;
    updated_by: number;
    updated_on: number;
    estimate: string | null;
    estimate_forecast: string | null;
    suite_id: number;
    display_order: number;
    is_deleted: number;
    labels: any[];
    [key: string]: any;
}

export interface Section {
    id: number;
    name: string;
    description: string | null;
    parent_id: number | null;
    depth: number;
    display_order: number;
    suite_id: number;
}

export interface Priority {
    id: number;
    is_default: boolean;
    name: string;
    priority: number;
    short_name: string;
}

export interface CaseType {
    id: number;
    is_default: boolean;
    name: string;
}

export interface CaseField {
    id: number;
    name: string;
    system_name: string;
    label: string;
    type_id: number;
    template_ids: number[];
    is_active: boolean;
    display_order: number;
    description: string | null;
    include_all: boolean;
    configs: CaseFieldConfig[];
}

export interface CaseFieldConfig {
    context: {
        is_global: boolean;
        project_ids: number[] | null;
    };
    options: {
        default_value?: string;
        format?: string;
        is_required?: boolean;
        rows?: string;
        items?: string;
    };
}
