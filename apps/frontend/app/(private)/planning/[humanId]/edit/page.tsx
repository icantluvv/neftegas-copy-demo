import { getPlan } from "@repo/api/base/codegen/clients/plansController/getPlan";

import { AccessDeniedScreen } from "../../../components/access-denied-screen";
import { NotFoundScreen } from "../not-found-screen";
import { EditPlanTypeForm } from "./components/edit-plan-type-form";
import { isHttpError } from "#/utils/http-error";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ humanId: string }>;
};

export default async function EditPlanTypePage({ params }: PageProps) {
  const { humanId } = await params;

  let detail;
  try {
    detail = await getPlan({ humanId });
  } catch (error) {
    if (isHttpError(error, 403)) {
      return <AccessDeniedScreen />;
    }
    if (isHttpError(error, 404)) {
      return <NotFoundScreen />;
    }
    throw error;
  }

  if (!(detail.isFilialOwner && detail.status === "DRAFT")) {
    return <AccessDeniedScreen />;
  }

  return <EditPlanTypeForm humanId={detail.humanId} currentPlanTypeId={detail.planType.id} />;
}
