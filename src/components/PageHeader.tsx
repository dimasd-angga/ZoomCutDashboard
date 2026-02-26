import { cn } from "@/lib/utils";
import * as React from "react";

export function PageHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <header
      className={cn("sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6", className)}
      {...props}
    />
  );
}

export function PageHeaderTitle({
    className,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
      <h1
        className={cn("text-lg font-semibold md:text-2xl", className)}
        {...props}
      />
    );
  }