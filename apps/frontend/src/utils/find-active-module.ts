import {ModuleTab, modules} from "@/app/(private)/constants";

export function findActiveModule(pathname: string): ModuleTab | undefined {
    return modules.find(
        (module) => pathname === module.href || (module.matchPrefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false)
    );
}
