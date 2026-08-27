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

export interface ModuleTab extends NavItem {
    /**
     * Доп. префиксы маршрутов модуля: вкладка остаётся активной на любой
     * странице внутри модуля (например, «Создать корректировку»), не только
     * на своём `href`.
     */
    matchPrefixes?: string[];
    /**
     * Пункты бокового меню, принадлежащие именно этому модулю — видны только
     * пока пользователь находится внутри модуля. У каждого модуля будет свой
     * набор (сейчас заполнен только для «Корректировки», остальные —
     * заглушки без действий).
     */
    sidebarItems?: NavItem[];
}

const HOME_NAV_ITEM: NavItem = {href: "/dashboard", label: "Рабочий стол", icon: Home};
const NOTIFICATIONS_NAV_ITEM: NavItem = {href: "/notifications", label: "Уведомления", icon: Bell};

/** Верхние вкладки: переключают рабочую область между разделами ДТОиР. */
export const topTabs: ModuleTab[] = [
    {href: "/planning", label: "План на 2027", icon: CalendarRange, sidebarItems: []},
    {href: "/execution", label: "Выполнение", icon: PlayCircle, sidebarItems: []},
    {
        href: "/dashboard",
        label: "Корректировка",
        icon: LayoutDashboard,
        matchPrefixes: ["/corrections"],
        sidebarItems: [{href: "/corrections/create", label: "Создать корректировку", icon: FilePlus, roles: ["FILIAL"]}],
    },
    {href: "/fact", label: "Факт", icon: ClipboardCheck, sidebarItems: []},
];

/** Модуль, которому принадлежит текущий маршрут (по `href` или `matchPrefixes`). */
export function findActiveModule(pathname: string): ModuleTab | undefined {
    return topTabs.find(
        (tab) => pathname === tab.href || (tab.matchPrefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false)
    );
}

/**
 * Пункты бокового меню для текущего маршрута: общие для всех модулей
 * («Рабочий стол», «Уведомления») плюс собственные пункты активного модуля.
 */
export function getSidebarItems(pathname: string): NavItem[] {
    const activeModule = findActiveModule(pathname);

    return [HOME_NAV_ITEM, ...(activeModule?.sidebarItems ?? []), NOTIFICATIONS_NAV_ITEM];
}


export const READ_FILTER_LABELS = {
    all: "Все",
    unread: "Только непрочитанные",
    read: "Только прочитанные",
} as const;

export const READ_FILTERS = Object.keys(READ_FILTER_LABELS) as (keyof typeof READ_FILTER_LABELS)[];

export type ReadFilter = (typeof READ_FILTERS)[number];
