import {getCorrectionStatsDtoe} from "@repo/api/base/codegen/clients/correctionsController/getCorrectionStatsDtoe";

import {isForbiddenError, isUnauthorizedError} from "#/utils/http-error";

import {AccessDeniedScreen} from "../../components/access-denied-screen";
import {CorrectionStatsGrid} from "./correction-stats-grid";

export async function DtoeDashboard() {
    let stats: Awaited<ReturnType<typeof getCorrectionStatsDtoe>>;
    try {
        stats = await getCorrectionStatsDtoe();
    } catch (error) {
        if (isForbiddenError(error)) {
            return <AccessDeniedScreen/>;
        }
        // 401 обрабатывает и редиректит на / родительский PrivateLayout —
        // здесь молча ничего не рендерим, чтобы не задублировать ошибку
        // (страница `/dashboard` рендерится в том же дереве, что и родитель,
        // и тоже успевает получить 401 до применения его редиректа).
        if (isUnauthorizedError(error)) {
            return null;
        }
        throw error;
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-5 md:p-8">
            <h1 className="text-2xl font-semibold">ДТОиР</h1>
            <CorrectionStatsGrid
                tiles={[
                    {label: "Всего корректировок", value: stats.total},
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
