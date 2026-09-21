"use client";

import type { PlanDetail } from "@/packages/api/base/codegen";

import { DataTable } from "#/components/ui/data-table";

import { RemarksActionBar } from "./remarks-action-bar";
import { createRemarksColumns } from "./remarks-columns";

interface RemarksListProps {
  detail: PlanDetail;
  currentUserId: number;
}

export function RemarksList({ detail, currentUserId }: RemarksListProps) {
  const columns = createRemarksColumns({ detail, currentUserId });

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Замечания</h2>
        <RemarksActionBar detail={detail} />
      </div>
      <DataTable
        columns={columns}
        data={detail.remarks}
        getRowId={(remark) => String(remark.id)}
        emptyMessage="Замечаний нет"
      />
    </div>
  );
}
