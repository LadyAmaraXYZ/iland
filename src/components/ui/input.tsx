import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-sm border border-line bg-bg px-3 text-base text-fg outline-none",
        "placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-fg/30",
        className,
      )}
      {...props}
    />
  );
}
