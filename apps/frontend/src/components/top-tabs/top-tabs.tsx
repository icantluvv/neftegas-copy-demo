"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

import {cn} from "@/lib/utils";

import {topTabs} from "@/app/(private)/constants";

export function TopTabs() {
    const pathname = usePathname();

    return (
        <nav className="flex shrink-0 flex-wrap items-center gap-2">
            {topTabs.map((tab) => {
                const isActive =
                    pathname === tab.href ||
                    (tab.matchPrefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false);
                const Icon = tab.icon;

                return (
                    <Link
                        key={tab.label}
                        href={tab.href}
                        className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <Icon className="size-4 shrink-0" aria-hidden="true"/>
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
