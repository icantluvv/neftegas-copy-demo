import {Bell, CalendarRange, ClipboardCheck, FilePlus, LayoutDashboard, PlayCircle, type LucideIcon} from "lucide-react";

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
    sidebarItems?: NavItem[];
}

export const FALLBACK_HOME_HREF = "/dashboard";

export const topTabs: ModuleTab[] = [
    {
        href: "/planning",
        label: "План на 2027",
        icon: CalendarRange,
        matchPrefixes: ["/planning"],
        sidebarItems: [{href: "/planning/create", label: "Создать корректировку", icon: FilePlus, roles: ["FILIAL"]}],
    },
    {href: "/execution", label: "Выполнение", icon: PlayCircle, sidebarItems: []},
    {
        href: "/dashboard",
        label: "Корректировка",
        icon: LayoutDashboard,
        matchPrefixes: ["/corrections", "/notifications"],
        sidebarItems: [
            {href: "/corrections/create", label: "Создать корректировку", icon: FilePlus, roles: ["FILIAL"]},
            {href: "/notifications", label: "Уведомления", icon: Bell},
        ],
    },
    {href: "/fact", label: "Факт", icon: ClipboardCheck, sidebarItems: []},
];


export const READ_FILTER_LABELS = {
    all: "Все",
    unread: "Только непрочитанные",
    read: "Только прочитанные",
} as const;

export const READ_FILTERS = Object.keys(READ_FILTER_LABELS) as (keyof typeof READ_FILTER_LABELS)[];

export type ReadFilter = (typeof READ_FILTERS)[number];
