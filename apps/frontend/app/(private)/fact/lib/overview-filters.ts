import type { FactPackageListItem, FactPackageStatus2 } from "@/packages/api/base/codegen";

import { FACT_STAGE_GROUPS } from "../constants";

export function groupKeyOfStatus(status: FactPackageStatus2): string {
  return FACT_STAGE_GROUPS.find((group) => group.statuses.includes(status))?.key ?? "draft";
}

export function factPackageMatchesStageFilter(status: FactPackageStatus2, filterValue: string): boolean {
  if (filterValue === "all") return true;
  if (filterValue.startsWith("group:")) {
    return groupKeyOfStatus(status) === filterValue.slice("group:".length);
  }
  return true;
}

export function factPackageMatchesCfoFilter(item: FactPackageListItem, statusFilter: string, filialFilter: string): boolean {
  if (statusFilter !== "all" && item.myCfoStatus !== statusFilter) return false;
  if (filialFilter !== "all" && String(item.filial.id) !== filialFilter) return false;
  return true;
}
