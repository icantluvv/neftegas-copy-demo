import {getCorrectionStatsCfo} from "@repo/api/base/codegen/clients/correctionsController/getCorrectionStatsCfo";

import {AccessDeniedScreen} from "../components/access-denied-screen";

export const dynamic = "force-dynamic";

function isForbiddenError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const cause = error.cause as { status?: number } | undefined;
    return cause?.status === 403;
}

export default async function CfoLayout({children}: { children: React.ReactNode }) {
    try {
        await getCorrectionStatsCfo();
    } catch (error) {
        if (isForbiddenError(error)) {
            return <AccessDeniedScreen/>;
        }
        throw error;
    }

    return <>{children}</>;
}
