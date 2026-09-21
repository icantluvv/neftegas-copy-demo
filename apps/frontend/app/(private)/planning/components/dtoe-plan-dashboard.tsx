import { getPlanStatsDtoe } from "@repo/api/base/codegen/clients/plansController/getPlanStatsDtoe";

import { StatsGrid } from "#/components/stats-grid";
import { isForbiddenError, isUnauthorizedError } from "#/utils/http-error";

import { AccessDeniedScreen } from "../../components/access-denied-screen";

export async function DtoePlanDashboard() {
    let stats: Awaited<ReturnType<typeof getPlanStatsDtoe>>;
    try {
        stats = await getPlanStatsDtoe();
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
            <h1 className="text-2xl font-semibold">План на 2027 — ДТОиР</h1>
            <StatsGrid
                tiles={[
                    {label: "Всего планов", value: stats.total},
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
