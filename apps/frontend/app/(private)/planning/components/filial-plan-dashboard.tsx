import { getPlanStatsFilial } from "@repo/api/base/codegen/clients/plansController/getPlanStatsFilial";

import { StatsGrid } from "#/components/stats-grid";
import { isForbiddenError, isUnauthorizedError } from "#/utils/http-error";

import { AccessDeniedScreen } from "../../components/access-denied-screen";
import { FilialPlansOverview } from "./filial-plans-overview";

export async function FilialPlanDashboard() {
    let stats: Awaited<ReturnType<typeof getPlanStatsFilial>>;
    try {
        stats = await getPlanStatsFilial();
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
            <h1 className="text-2xl font-semibold">Мои планы на 2027</h1>
            <StatsGrid
                tiles={[
                    {label: "Всего", value: stats.total},
                    {label: "На проверке", value: stats.inReview, tone: "warning"},
                    {label: "Возвращено", value: stats.returned, tone: "danger"},
                    {label: "Согласовано ДТОиР", value: stats.approved, tone: "success"},
                ]}
            />
            <FilialPlansOverview/>
        </div>
    );
}
