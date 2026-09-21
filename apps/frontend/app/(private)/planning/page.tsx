import {getMe} from "@repo/api/base/codegen/clients/authController/getMe";

import {AccessDeniedScreen} from "../components/access-denied-screen";
import {CfoPlanDashboard} from "./components/cfo-plan-dashboard";
import {DtoePlanDashboard} from "./components/dtoe-plan-dashboard";
import {FilialPlanDashboard} from "./components/filial-plan-dashboard";
import {getDashboardKind} from "#/utils/get-dashboard-kind";

export const dynamic = "force-dynamic";

export default async function PlanningPage() {
    const user = await getMe();
    const kind = getDashboardKind(user.role);

    switch (kind) {
        case "filial":
            return <FilialPlanDashboard/>;
        case "cfo":
            return <CfoPlanDashboard/>;
        case "dtoe":
            return <DtoePlanDashboard/>;
        default:
            return <AccessDeniedScreen/>;
    }
}
