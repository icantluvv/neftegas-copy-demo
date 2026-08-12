import {getCorrectionStatsCfo} from "@repo/api/base/codegen/clients/correctionsController/getCorrectionStatsCfo";

import {AccessDeniedScreen} from "../../components/access-denied-screen";

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

export async function CfoDashboard() {
    try {
        await getCorrectionStatsCfo();
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
        <div className="flex flex-1 flex-col p-4 pt-5 md:p-8">
            <h1 className="text-2xl font-semibold">ЦФО</h1>
        </div>
    );
}
