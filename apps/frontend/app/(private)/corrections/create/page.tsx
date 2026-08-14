import {getMe} from "@repo/api/base/codegen/clients/authController/getMe";

import {AccessDeniedScreen} from "../../components/access-denied-screen";
import {CreateCorrectionForm} from "./components/create-correction-form";

export default async function CreateCorrectionPage() {
  const user = await getMe();
  if (user.role !== "FILIAL") {
    return <AccessDeniedScreen />;
  }
  return <CreateCorrectionForm />;
}
