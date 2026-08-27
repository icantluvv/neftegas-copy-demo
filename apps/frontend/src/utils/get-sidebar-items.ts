import {Home} from "lucide-react";

import {FALLBACK_HOME_HREF, NavItem} from "@/app/(private)/constants";
import {findActiveModule} from "#/utils/find-active-module";

export function getSidebarItems(pathname: string): NavItem[] {
    const activeModule = findActiveModule(pathname);
    const homeItem: NavItem = {
        href: activeModule?.href ?? FALLBACK_HOME_HREF,
        label: "Рабочий стол",
        icon: Home,
    };

    return [homeItem, ...(activeModule?.sidebarItems ?? [])];
}
