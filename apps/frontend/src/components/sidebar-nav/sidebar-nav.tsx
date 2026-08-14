"use client";

import {LogOut, Menu, X} from "lucide-react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {useState} from "react";
import {toast} from "sonner";

import {Button} from "#/components/ui/button";
import {cn} from "@/lib/utils";
import {AuthUser, useLogout} from "@/packages/api/base/codegen";

import {navItems} from "@/app/(private)/constants";
import {getInitials} from "#/utils/get-initials";

export function SidebarNav({user}: { user: AuthUser }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const logout = useLogout({
        mutation: {
            onSuccess: () => {
                router.replace("/");
            },
            onError: () => {
                toast.error("Не удалось выйти из аккаунта");
            },
        },
    });

    function handleLogout() {
        logout.mutate();
    }

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
                onClick={() => setIsOpen((open) => !open)}
                className="fixed top-2 left-4 z-50 size-9 bg-sidebar text-sidebar-foreground hover:bg-sidebar hover:text-sidebar-foreground md:hidden"
            >
                {isOpen ? <X className="size-5"/> : <Menu className="size-5"/>}
            </Button>

            <aside
                className={cn(
                    "z-40 h-full shrink-0 flex-col justify-between gap-8 overflow-y-auto bg-sidebar p-4 text-sidebar-foreground md:static md:flex md:w-1/5",
                    isOpen ? "fixed inset-0 flex w-full" : "hidden"
                )}
            >
                <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-3 pt-12 md:pt-0">
                        <div
                            data-testid="sidebar-logo"
                            aria-hidden="true"
                            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/10"
                        />
                        <span className="text-sm font-semibold uppercase">Черноморнефтегаз</span>
                    </div>

                    <nav className="flex flex-col gap-1">
                        {navItems
                            .filter((item) => !item.roles || item.roles.includes(user.role))
                            .map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex min-h-12 items-center rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-white/10",
                                        isActive && "bg-white/10"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            aria-hidden="true"
                            className="flex size-9 shrink-0 select-none items-center justify-center rounded-full bg-white/10 text-xs font-semibold"
                        >
                            {getInitials(user.fullName)}
                        </div>
                        <span className="truncate text-base font-medium">{user.fullName}</span>
                    </div>

                    <Button
                        variant="ghost"
                        size='icon-lg'
                        aria-label="Выйти"
                        className="shrink-0 text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground"
                        onClick={handleLogout}
                        disabled={logout.isPending}
                    >
                        <LogOut className="size-4"/>
                    </Button>
                </div>
            </aside>
        </>
    );
}
