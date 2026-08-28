import {Bell, CalendarRange, ClipboardCheck, FilePlus, Home, PlayCircle, type LucideIcon} from "lucide-react";

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

export interface NavSection extends NavItem {
    matchPrefixes?: string[];
}

export const sidebarItems: NavSection[] = [
    {href: "/dashboard", label: "Рабочий стол", icon: Home, matchPrefixes: ["/corrections"]},
    {href: "/planning", label: "План на 2027", icon: CalendarRange, matchPrefixes: ["/planning"]},
    {href: "/execution", label: "Выполнение", icon: PlayCircle},
    {href: "/fact", label: "Факт", icon: ClipboardCheck},
    {href: "/corrections/create", label: "Создать корректировку", icon: FilePlus, roles: ["FILIAL"]},
    {href: "/notifications", label: "Уведомления", icon: Bell},
];

export function isNavItemActive(item: NavSection, pathname: string): boolean {
    return pathname === item.href || (item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false);
}


export const READ_FILTER_LABELS = {
    all: "Все",
    unread: "Только непрочитанные",
    read: "Только прочитанные",
} as const;

export const READ_FILTERS = Object.keys(READ_FILTER_LABELS) as (keyof typeof READ_FILTER_LABELS)[];

export type ReadFilter = (typeof READ_FILTERS)[number];
