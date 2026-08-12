import {getCorrectionStatsFilial} from "@repo/api/base/codegen/clients/correctionsController/getCorrectionStatsFilial";

import {AccessDeniedScreen} from "../components/access-denied-screen";

export const dynamic = "force-dynamic";

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

export default async function FilialLayout({children}: { children: React.ReactNode }) {
    try {
        await getCorrectionStatsFilial();
    } catch (error) {
        if (isForbiddenError(error)) {
            return <AccessDeniedScreen/>;
        }
        // 401 обрабатывает и редиректит на / родительский PrivateLayout —
        // здесь молча ничего не рендерим, чтобы не дублировать ошибку в лог
        // (сегменты роутов рендерятся параллельно, поэтому этот layout тоже
        // успевает получить 401 до того, как редирект родителя применится).
        if (isUnauthorizedError(error)) {
            return null;
        }
        throw error;
    }

    return <>{children}</>;
}
