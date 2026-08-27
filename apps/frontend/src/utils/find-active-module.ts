import {ModuleTab, topTabs} from "@/app/(private)/constants";

export function findActiveModule(pathname: string): ModuleTab | undefined {
    return topTabs.find(
        (tab) => pathname === tab.href || (tab.matchPrefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false)
    );
}
