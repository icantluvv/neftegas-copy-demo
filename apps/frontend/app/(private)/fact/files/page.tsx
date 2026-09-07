import {getMe} from "@repo/api/base/codegen/clients/authController/getMe";

import {AccessDeniedScreen} from "../../components/access-denied-screen";
import {CfoFactFiles} from "./components/cfo-fact-files";
import {FactDirectionsOverview} from "./components/fact-directions-overview";
import {FactPackagesReviewList} from "./components/fact-packages-review-list";
import {getDashboardKind} from "#/utils/get-dashboard-kind";

export const dynamic = "force-dynamic";

export default async function FactFilesPage() {
    const user = await getMe();
    const kind = getDashboardKind(user.role);

    switch (kind) {
        case "filial":
            return <FactDirectionsOverview/>;
        case "cfo":
            return <CfoFactFiles/>;
        case "dtoe":
            return <FactPackagesReviewList/>;
        default:
            return <AccessDeniedScreen/>;
    }
}
