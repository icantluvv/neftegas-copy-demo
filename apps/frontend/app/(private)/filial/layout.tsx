import {getCorrectionStatsFilial} from "@repo/api/base/codegen/clients/correctionsController/getCorrectionStatsFilial";

import {AccessDeniedScreen} from "../components/access-denied-screen";

export const dynamic = "force-dynamic";

function isForbiddenError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const cause = error.cause as { status?: number } | undefined;
    return cause?.status === 403;
}

export default async function FilialLayout({children}: { children: React.ReactNode }) {
    try {
        await getCorrectionStatsFilial();
    } catch (error) {
        if (isForbiddenError(error)) {
            return <AccessDeniedScreen/>;
        }
        throw error;
    }

    return <>{children}</>;
}
