import {getMe} from "@repo/api/base/codegen/clients/authController/getMe";
import {redirect} from "next/navigation";

import {NotificationBell} from "#/components/notification-bell";
import {SidebarNav} from "#/components/sidebar-nav";
import {TopQuickActions} from "#/components/top-quick-actions";
import {getHttpErrorStatus} from "#/utils/http-error";

export const dynamic = "force-dynamic";

const REDIRECT_TO_LOGIN_STATUSES = new Set([401, 403, 413]);

function isRedirectToLoginError(error: unknown): boolean {
    const status = getHttpErrorStatus(error);

    return status != null && REDIRECT_TO_LOGIN_STATUSES.has(status);
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
        <div className="flex h-svh">
            <SidebarNav user={user}/>

            <div className="flex h-full w-full flex-1 flex-col overflow-hidden md:w-4/5">
                <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border py-2 pr-4 pl-16 md:pl-4">
                    <TopQuickActions user={user}/>
                    <NotificationBell/>
                </header>
                <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}
