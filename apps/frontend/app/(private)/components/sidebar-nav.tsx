"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLogout } from "@/packages/api/base/codegen";

const navItems: { href: string; label: string }[] = [];

export function SidebarNav() {
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
      <button
        type="button"
        aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
        onClick={() => setIsOpen((open) => !open)}
        className="fixed top-4 left-4 z-50 flex size-9 items-center justify-center rounded-lg bg-sidebar text-sidebar-foreground md:hidden"
      >
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      <aside
        className={cn(
          "z-40 flex-col justify-between gap-8 bg-sidebar p-4 text-sidebar-foreground md:static md:flex md:w-1/5",
          isOpen ? "fixed inset-0 flex w-full" : "hidden"
        )}
      >
        <nav className="flex flex-col gap-1 pt-12 md:pt-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10",
                  isActive && "bg-white/10"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Button
          variant="ghost"
          className="justify-start text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground"
          onClick={handleLogout}
          disabled={logout.isPending}
        >
          Выйти
        </Button>
      </aside>
    </>
  );
}
