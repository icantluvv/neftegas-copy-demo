import {Bell, CalendarRange, ClipboardCheck, FilePlus, FileText, Home, LayoutDashboard, PlayCircle, type LucideIcon} from "lucide-react";

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
    icon: LucideIcon;
    roles?: AuthUser["role"][];
}

export interface ModuleTab extends NavItem {
    matchPrefixes?: string[];
    quickActions: NavItem[];
}

export const FALLBACK_HOME_HREF = "/dashboard";

export const modules: ModuleTab[] = [
    {
        href: "/planning",
        label: "План на 2027",
        icon: CalendarRange,
        matchPrefixes: ["/planning"],
        quickActions: [
            {href: "/planning", label: "Рабочий стол", icon: Home},
            {href: "/planning/files", label: "Файлы", icon: FileText},
            {href: "/planning/notifications", label: "Уведомления", icon: Bell},
        ],
    },
    {
        href: "/execution",
        label: "Выполнение",
        icon: PlayCircle,
        matchPrefixes: ["/execution"],
        quickActions: [
            {href: "/execution", label: "Рабочий стол", icon: Home},
            {href: "/execution/files", label: "Файлы", icon: FileText},
            {href: "/execution/notifications", label: "Уведомления", icon: Bell},
        ],
    },
    {
        href: "/dashboard",
        label: "Корректировка",
        icon: LayoutDashboard,
        matchPrefixes: ["/corrections", "/notifications"],
        quickActions: [
            {href: "/dashboard", label: "Рабочий стол", icon: Home},
            {href: "/corrections/create", label: "Создать корректировку", icon: FilePlus, roles: ["FILIAL", "CFO"]},
            {href: "/notifications", label: "Уведомления", icon: Bell},
        ],
    },
    {
        href: "/fact",
        label: "Факт",
        icon: ClipboardCheck,
        matchPrefixes: ["/fact"],
        quickActions: [
            {href: "/fact", label: "Рабочий стол", icon: Home},
            {href: "/fact/files", label: "Файлы", icon: FileText},
            {href: "/fact/notifications", label: "Уведомления", icon: Bell},
        ],
    },
];


export const READ_FILTER_LABELS = {
    all: "Все",
    unread: "Только непрочитанные",
    read: "Только прочитанные",
} as const;

export const READ_FILTERS = Object.keys(READ_FILTER_LABELS) as (keyof typeof READ_FILTER_LABELS)[];

export type ReadFilter = (typeof READ_FILTERS)[number];
