import {getMe} from "@repo/api/base/codegen/clients/authController/getMe";
import {redirect} from "next/navigation";

import {NotificationBell} from "#/components/notification-bell";
import {SidebarNav} from "#/components/sidebar-nav";

export const dynamic = "force-dynamic";

const REDIRECT_TO_LOGIN_STATUSES = new Set([401, 403, 413]);

function isRedirectToLoginError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const cause = error.cause as { status?: number } | undefined;
    return cause?.status != null && REDIRECT_TO_LOGIN_STATUSES.has(cause.status);
}

export default async function PrivateLayout({children}: { children: React.ReactNode }) {
    let user;
    try {
        user = await getMe();
    } catch (error) {
        if (isRedirectToLoginError(error)) {
            redirect("/");
        }
        throw error;
    }

    return (
        <div className="flex min-h-svh">
            <SidebarNav user={user}/>
            <div className="flex w-full flex-1 min-h-screen flex-col md:w-4/5">
                <header className="flex justify-end border-b border-border px-4 py-2">
                    <NotificationBell/>
                </header>
                <div className="flex-1">{children}</div>
            </div>
        </div>
    );
}
