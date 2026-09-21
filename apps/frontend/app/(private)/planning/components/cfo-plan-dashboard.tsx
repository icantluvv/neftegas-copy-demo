import { getPlanStatsCfo } from "@repo/api/base/codegen/clients/plansController/getPlanStatsCfo";

import { StatsGrid } from "#/components/stats-grid";
import { isForbiddenError, isUnauthorizedError } from "#/utils/http-error";

import { AccessDeniedScreen } from "../../components/access-denied-screen";
import { CfoPlansOverview } from "./cfo-plans-overview";

export async function CfoPlanDashboard() {
    let stats: Awaited<ReturnType<typeof getPlanStatsCfo>>;
    try {
        stats = await getPlanStatsCfo();
    } catch (error) {
        if (isForbiddenError(error)) {
            return <AccessDeniedScreen/>;
        }
        // 401 обрабатывает и редиректит на / родительский PrivateLayout —
        // здесь молча ничего не рендерим, чтобы не задублировать ошибку
        // (страница `/planning` рендерится в том же дереве, что и родитель,
        // и тоже успевает получить 401 до применения его редиректа).
        if (isUnauthorizedError(error)) {
            return null;
        }
        throw error;
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-5 md:p-8">
            <h1 className="text-2xl font-semibold">Планы на 2027 — Кабинет ЦФО</h1>
            <StatsGrid
                tiles={[
                    {label: "Всего направлено", value: stats.total},
                    {label: "На проверке у нас", value: stats.inReview, tone: "warning"},
                    {label: "Мы вернули", value: stats.returned, tone: "danger"},
                    {label: "Мы согласовали", value: stats.approved, tone: "success"},
                ]}
            />
            <CfoPlansOverview/>
        </div>
    );
}
