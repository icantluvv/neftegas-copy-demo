import {getMe} from "@repo/api/base/codegen/clients/authController/getMe";

import {AccessDeniedScreen} from "../../components/access-denied-screen";
import {CreatePlanForm} from "./components/create-plan-form";

export default async function CreatePlanPage() {
  const user = await getMe();
  if (user.role !== "FILIAL") {
    return <AccessDeniedScreen />;
  }
  return <CreatePlanForm />;
}
