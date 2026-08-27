import {Bell, CalendarRange, ClipboardCheck, FilePlus, Home, LayoutDashboard, PlayCircle, type LucideIcon} from "lucide-react";

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
    /** Отсутствие поля — пункт виден всем ролям. */
    roles?: AuthUser["role"][];
}

export const navItems: NavItem[] = [
    {href: "/dashboard", label: "Рабочий стол", icon: Home},
    {href: "/planning", label: "План на 2027", icon: CalendarRange},
    {href: "/execution", label: "Выполнение", icon: PlayCircle},
    {href: "/dashboard", label: "Корректировка", icon: LayoutDashboard},
    {href: "/fact", label: "Факт", icon: ClipboardCheck},
    {href: "/corrections/create", label: "Создать корректировку", icon: FilePlus, roles: ["FILIAL"]},
    {href: "/notifications", label: "Уведомления", icon: Bell},
];


export const READ_FILTER_LABELS = {
    all: "Все",
    unread: "Только непрочитанные",
    read: "Только прочитанные",
} as const;

export const READ_FILTERS = Object.keys(READ_FILTER_LABELS) as (keyof typeof READ_FILTER_LABELS)[];

export type ReadFilter = (typeof READ_FILTERS)[number];
