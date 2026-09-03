"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

import {cn} from "@/lib/utils";

import type {AuthUser} from "@/packages/api/base/codegen";

import {findActiveModule} from "#/utils/find-active-module";

export function TopQuickActions({user}: { user: AuthUser }) {
    const pathname = usePathname();
    const activeModule = findActiveModule(pathname);
    const quickActions = activeModule?.quickActions ?? [];

    return (
        <nav className="flex shrink-0 flex-wrap items-center gap-2">
            {quickActions
                .filter((item) => !item.roles || item.roles.includes(user.role))
                .map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <Icon className="size-4 shrink-0" aria-hidden="true"/>
                            {item.label}
                        </Link>
                    );
                })}
        </nav>
    );
}
