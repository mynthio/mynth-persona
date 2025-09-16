import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  `
  font-mono
  inline-flex items-center justify-center gap-[12px]
  cursor-pointer disabled:cursor-not-allowed
  transition-all duration-250 will-change-transform
  hover:bg-surface-100/50 hover:scale-105 active:scale-100 hover:text-surface-foreground
  `,
  {
    variants: {
      variant: {
        default:
          "text-surface-foreground/80 disabled:text-surface-foreground/30",
      },
      size: {
        default: "text-[0.80rem] h-[36px] px-[9px] rounded-[12px]",
        icon: "size-[42px] md:size-[36px] rounded-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
