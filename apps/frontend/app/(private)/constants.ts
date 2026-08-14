import type {AuthUser} from "@/packages/api/base/codegen";

export type DashboardKind = "filial" | "cfo" | "dtoe";

export const DASHBOARD_KIND_BY_ROLE: Partial<Record<AuthUser["role"], DashboardKind>> = {
    FILIAL: "filial",
    CFO: "cfo",
    DTOE: "dtoe",
};


export interface NavItem {
    href: string;
    label: string;
    /** Отсутствие поля — пункт виден всем ролям. */
    roles?: AuthUser["role"][];
}

export const navItems: NavItem[] = [
    {href: "/dashboard", label: "Рабочий стол"},
    {href: "/corrections/create", label: "Создать корректировку", roles: ["FILIAL"]},
    {href: "/notifications", label: "Уведомления"},
];


export const READ_FILTER_LABELS = {
    all: "Все",
    unread: "Только непрочитанные",
    read: "Только прочитанные",
} as const;

export const READ_FILTERS = Object.keys(READ_FILTER_LABELS) as (keyof typeof READ_FILTER_LABELS)[];

export type ReadFilter = (typeof READ_FILTERS)[number];
