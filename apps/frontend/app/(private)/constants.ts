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

const FALLBACK_HOME_HREF = "/dashboard";

/** Верхние вкладки: переключают рабочую область между разделами ДТОиР. */
export const topTabs: ModuleTab[] = [
    {
        href: "/planning",
        label: "План на 2027",
        icon: CalendarRange,
        matchPrefixes: ["/planning"],
        // Визуальная копия «Создать корректировку» из модуля «Корректировка»:
        // тот же вид формы и те же названия элементов пакета документов, но
        // без реального сохранения — раздел «План на 2027» ещё не подключён
        // к бэкенду и никак не связан с реальными корректировками.
        sidebarItems: [{href: "/planning/create", label: "Создать корректировку", icon: FilePlus, roles: ["FILIAL"]}],
    },
    {href: "/execution", label: "Выполнение", icon: PlayCircle, sidebarItems: []},
    {
        href: "/dashboard",
        label: "Корректировка",
        icon: LayoutDashboard,
        // «Уведомления» — только здесь: сегодня уведомления система генерирует
        // только по событиям корректировок (см. глоссарий), у остальных
        // модулей своих уведомлений пока нет.
        matchPrefixes: ["/corrections", "/notifications"],
        sidebarItems: [
            {href: "/corrections/create", label: "Создать корректировку", icon: FilePlus, roles: ["FILIAL"]},
            {href: "/notifications", label: "Уведомления", icon: Bell},
        ],
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
 * Пункты бокового меню для текущего маршрута: «Рабочий стол» ведёт на
 * домашнюю страницу активного модуля (не на чужой модуль), дальше —
 * собственные пункты этого модуля (могут быть пустыми — «в разработке»).
 */
export function getSidebarItems(pathname: string): NavItem[] {
    const activeModule = findActiveModule(pathname);
    const homeItem: NavItem = {
        href: activeModule?.href ?? FALLBACK_HOME_HREF,
        label: "Рабочий стол",
        icon: Home,
    };

    return [homeItem, ...(activeModule?.sidebarItems ?? [])];
}


export const READ_FILTER_LABELS = {
    all: "Все",
    unread: "Только непрочитанные",
    read: "Только прочитанные",
} as const;

export const READ_FILTERS = Object.keys(READ_FILTER_LABELS) as (keyof typeof READ_FILTER_LABELS)[];

export type ReadFilter = (typeof READ_FILTERS)[number];
