import {getFactPackageStatsFilial} from "@repo/api/base/codegen/clients/factPackagesController/getFactPackageStatsFilial";

import {isForbiddenError, isUnauthorizedError} from "#/utils/http-error";

import {AccessDeniedScreen} from "../../components/access-denied-screen";
import {FactStatsGrid} from "./fact-stats-grid";
import {FilialFactOverview} from "./filial-fact-overview";

export async function FilialFactDashboard() {
    let stats: Awaited<ReturnType<typeof getFactPackageStatsFilial>>;
    try {
        stats = await getFactPackageStatsFilial();
    } catch (error) {
        if (isForbiddenError(error)) {
            return <AccessDeniedScreen/>;
        }
        // 401 обрабатывает и редиректит на / родительский PrivateLayout — см.
        // FilialDashboard в app/(private)/dashboard/components для того же приёма.
        if (isUnauthorizedError(error)) {
            return null;
        }
        throw error;
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-5 md:p-8">
            <h1 className="text-2xl font-semibold">Мои факт-пакеты</h1>
            <FactStatsGrid
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
