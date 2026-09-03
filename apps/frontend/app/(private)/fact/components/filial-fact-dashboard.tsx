import {getFactPackageStatsFilial} from "@repo/api/base/codegen/clients/factPackagesController/getFactPackageStatsFilial";

import {StatsGrid} from "#/components/stats-grid";

import {factDashboardErrorGuard} from "../lib/dashboard-error-guard";
import {FilialFactOverview} from "./filial-fact-overview";

export async function FilialFactDashboard() {
    let stats: Awaited<ReturnType<typeof getFactPackageStatsFilial>>;
    try {
        stats = await getFactPackageStatsFilial();
    } catch (error) {
        return factDashboardErrorGuard(error);
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-5 md:p-8">
            <h1 className="text-2xl font-semibold">Мои факт-пакеты</h1>
            <StatsGrid
                tiles={[
                    {label: "Всего", value: stats.total},
                    {label: "На проверке", value: stats.inReview, tone: "warning"},
                    {label: "Возвращено", value: stats.returned, tone: "danger"},
                    {label: "Согласовано ДТОиР", value: stats.approved, tone: "success"},
                ]}
            />
            <FilialFactOverview/>
        </div>
    );
}
