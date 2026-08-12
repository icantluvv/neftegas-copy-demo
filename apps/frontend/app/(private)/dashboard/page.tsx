import {getMe} from "@repo/api/base/codegen/clients/authController/getMe";

import {AccessDeniedScreen} from "../components/access-denied-screen";
import {CfoDashboard} from "./components/cfo-dashboard";
import {DtoeDashboard} from "./components/dtoe-dashboard";
import {FilialDashboard} from "./components/filial-dashboard";
import {getDashboardKind} from "#/utils/get-dashboard-kind";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const user = await getMe();
    const kind = getDashboardKind(user.role);

    switch (kind) {
        case "filial":
            return <FilialDashboard/>;
        case "cfo":
            return <CfoDashboard/>;
        case "dtoe":
            return <DtoeDashboard/>;
        default:
            return <AccessDeniedScreen/>;
    }
}
