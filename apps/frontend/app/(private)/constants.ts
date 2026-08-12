import type {AuthUser} from "@/packages/api/base/codegen";

export type DashboardKind = "filial" | "cfo" | "dtoe";

export const DASHBOARD_KIND_BY_ROLE: Partial<Record<AuthUser["role"], DashboardKind>> = {
    FILIAL: "filial",
    CFO: "cfo",
    DTOE: "dtoe",
};


export const navItems: { href: string; label: string }[] = [
    {href: "/dashboard", label: "Рабочий стол"},
    {href: "/notifications", label: "Уведомления"},
];
