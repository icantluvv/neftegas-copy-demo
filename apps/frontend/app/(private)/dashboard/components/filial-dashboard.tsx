import {getCorrectionStatsFilial} from "@repo/api/base/codegen/clients/correctionsController/getCorrectionStatsFilial";

import {AccessDeniedScreen} from "../../components/access-denied-screen";
import {CorrectionStatsGrid} from "./correction-stats-grid";
import {FilialCorrectionsOverview} from "./filial-corrections-overview";

function isForbiddenError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const cause = error.cause as { status?: number } | undefined;
    return cause?.status === 403;
}

function isUnauthorizedError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const cause = error.cause as { status?: number } | undefined;
    return cause?.status === 401;
}

export async function FilialDashboard() {
    let stats: Awaited<ReturnType<typeof getCorrectionStatsFilial>>;
    try {
        stats = await getCorrectionStatsFilial();
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
            <h1 className="text-2xl font-semibold">Мои корректировки</h1>
            <CorrectionStatsGrid
                tiles={[
                    {label: "Всего", value: stats.total},
                    {label: "На проверке", value: stats.inReview, tone: "warning"},
                    {label: "Возвращено", value: stats.returned, tone: "danger"},
                    {label: "Согласовано ДТОиР", value: stats.approved, tone: "success"},
                ]}
            />
            <FilialCorrectionsOverview/>
        </div>
    );
}
