import { getMe } from "@repo/api/base/codegen/clients/authController/getMe";
import { redirect } from "next/navigation";

const REDIRECT_TO_LOGIN_STATUSES = new Set([401, 403, 413]);

function isRedirectToLoginError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const cause = error.cause as { status?: number } | undefined;
  return cause?.status != null && REDIRECT_TO_LOGIN_STATUSES.has(cause.status);
}

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  try {
    await getMe();
  } catch (error) {
    if (isRedirectToLoginError(error)) {
      redirect("/login");
    }
    throw error;
  }

  return <>{children}</>;
}
