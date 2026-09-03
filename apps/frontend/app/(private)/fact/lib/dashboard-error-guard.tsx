import { isForbiddenError, isUnauthorizedError } from "#/utils/http-error";

import { AccessDeniedScreen } from "../../components/access-denied-screen";

export function factDashboardErrorGuard(error: unknown): React.ReactNode {
  if (isForbiddenError(error)) {
    return <AccessDeniedScreen />;
  }
  if (isUnauthorizedError(error)) {
    return null;
  }
  throw error;
}
