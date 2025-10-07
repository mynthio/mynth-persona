import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  `
  font-mono uppercase font-[600] leading-0
  inline-flex items-center justify-center shrink-0
  `,
  {
    variants: {
      variant: {
        default: "border-[2px]",
        outline: "border-[2px]",
      },
      color: {
        default:
          "text-surface-foreground/80 disabled:text-surface-foreground/30 hover:bg-surface-100/50 hover:text-surface-foreground",
        primary: "bg-primary text-primary-foreground",
        red: "text-rose-800 bg-rose-200/50 border-rose-200 hover:bg-rose-100/20",
        green:
          "text-emerald-800 bg-emerald-200/50 border-emerald-200 hover:bg-emerald-100/20",
      },
      size: {
        default: "text-[0.95rem] h-[40px] px-[16px] rounded-[17px] gap-[12px]",
        sm: "text-[0.78rem] h-[38px] md:h-[34px] px-[12px] rounded-[15px] gap-[4px]",

        icon: "size-[42px] md:size-[40px] rounded-[17px] text-[0.80rem]",
        "icon-sm": "size-[38px] md:size-[32px] rounded-[11px] text-[0.90rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      color: "default",
    },
  }
);

type LabelProps = React.ComponentProps<"div"> &
  VariantProps<typeof labelVariants>;

function Label({ className, variant, size, color, ...props }: LabelProps) {
  return (
    <div
      className={cn(labelVariants({ variant, size, color, className }))}
      {...props}
    />
  );
}

export { Label, labelVariants };
