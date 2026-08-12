import type {AuthUser} from "@/packages/api/base/codegen";
import {DASHBOARD_KIND_BY_ROLE, DashboardKind} from "@/app/(private)/constants";


export function getDashboardKind(role: AuthUser["role"]): DashboardKind | undefined {
    return DASHBOARD_KIND_BY_ROLE[role];
}
