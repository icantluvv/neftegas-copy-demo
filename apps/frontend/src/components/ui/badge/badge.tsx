import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-md border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        info: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
        success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
        warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
        danger: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ tone, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
