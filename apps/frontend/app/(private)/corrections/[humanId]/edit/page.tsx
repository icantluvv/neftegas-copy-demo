import { getCorrection } from "@repo/api/base/codegen/clients/correctionsController/getCorrection";

import { AccessDeniedScreen } from "../../../components/access-denied-screen";
import { NotFoundScreen } from "../not-found-screen";
import { EditCorrectionTypeForm } from "./components/edit-correction-type-form";
import { isHttpError } from "#/utils/http-error";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ humanId: string }>;
};

export default async function EditCorrectionTypePage({ params }: PageProps) {
  const { humanId } = await params;

  let detail;
  try {
    detail = await getCorrection({ humanId });
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

  return <EditCorrectionTypeForm humanId={detail.humanId} currentCorrectionTypeId={detail.correctionType.id} />;
}
