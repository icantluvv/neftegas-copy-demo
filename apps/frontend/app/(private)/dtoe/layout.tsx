import {getCorrectionStatsDtoe} from "@repo/api/base/codegen/clients/correctionsController/getCorrectionStatsDtoe";

import {AccessDeniedScreen} from "../components/access-denied-screen";

export const dynamic = "force-dynamic";

function isForbiddenError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const cause = error.cause as { status?: number } | undefined;
    return cause?.status === 403;
}

export default async function DtoeLayout({children}: { children: React.ReactNode }) {
    try {
        await getCorrectionStatsDtoe();
    } catch (error) {
        if (isForbiddenError(error)) {
            return <AccessDeniedScreen/>;
        }
        throw error;
    }

    return <>{children}</>;
}
