import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  `
  font-mono
  inline-flex items-center justify-center gap-[12px]
  cursor-pointer disabled:cursor-not-allowed
  transition-all duration-250 will-change-transform
  hover:scale-105 active:scale-100
  `,
  {
    variants: {
      variant: {
        default: "bg-none",
        outline: "border-[2px]",
      },
      color: {
        default:
          "text-surface-foreground/80 disabled:text-surface-foreground/30 hover:bg-surface-100/50 hover:text-surface-foreground",
        primary: "bg-primary text-primary-foreground",
        red: "text-red-500 border-red-100 hover:bg-red-100/20",
      },
      size: {
        default: "text-[0.95rem] h-[40px] px-[16px] rounded-[17px]",
        sm: "text-[0.78rem] h-[38px] md:h-[34px] px-[12px] rounded-[15px]",

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

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

function Button({
  className,
  variant,
  size,
  color,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, color, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
