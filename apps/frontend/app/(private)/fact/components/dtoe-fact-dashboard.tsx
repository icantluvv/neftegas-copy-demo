import {getFactPackageStatsDtoe} from "@repo/api/base/codegen/clients/factPackagesController/getFactPackageStatsDtoe";

import {StatsGrid} from "#/components/stats-grid";

import {factDashboardErrorGuard} from "../lib/dashboard-error-guard";

export async function DtoeFactDashboard() {
    let stats: Awaited<ReturnType<typeof getFactPackageStatsDtoe>>;
    try {
        stats = await getFactPackageStatsDtoe();
    } catch (error) {
        return factDashboardErrorGuard(error);
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-5 md:p-8">
            <h1 className="text-2xl font-semibold">ДТОиР — Факт</h1>
            <StatsGrid
                tiles={[
                    {label: "Всего факт-пакетов", value: stats.total},
                    {label: "На проверке у ЦФО", value: stats.inReview},
                    {label: "Возвращено на доработку", value: stats.returned},
                    {label: "Согласовано ДТОиР", value: stats.approved},
                    {label: "На проверке у ДТОиР", value: stats.underReview ?? 0},
                    {label: "Открытых замечаний", value: stats.openRemarks ?? 0},
                ]}
            />
        </div>
    );
}
