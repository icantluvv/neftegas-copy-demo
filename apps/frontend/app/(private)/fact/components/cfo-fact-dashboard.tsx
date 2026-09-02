import {getFactPackageStatsCfo} from "@repo/api/base/codegen/clients/factPackagesController/getFactPackageStatsCfo";

import {isForbiddenError, isUnauthorizedError} from "#/utils/http-error";

import {AccessDeniedScreen} from "../../components/access-denied-screen";
import {CfoFactOverview} from "./cfo-fact-overview";
import {FactStatsGrid} from "./fact-stats-grid";

export async function CfoFactDashboard() {
    let stats: Awaited<ReturnType<typeof getFactPackageStatsCfo>>;
    try {
        stats = await getFactPackageStatsCfo();
    } catch (error) {
        if (isForbiddenError(error)) {
            return <AccessDeniedScreen/>;
        }
        if (isUnauthorizedError(error)) {
            return null;
        }
        throw error;
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-5 md:p-8">
            <h1 className="text-2xl font-semibold">Факт-пакеты ЦФО</h1>
            <FactStatsGrid
                tiles={[
                    {label: "Всего направлено", value: stats.total},
                    {label: "На проверке у нас", value: stats.inReview, tone: "warning"},
                    {label: "Мы вернули", value: stats.returned, tone: "danger"},
                    {label: "Мы согласовали", value: stats.approved, tone: "success"},
                ]}
            />
            <CfoFactOverview/>
        </div>
    );
}
