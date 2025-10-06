import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LineVerticalIcon } from "@phosphor-icons/react/dist/ssr";

const buttonGroupVariants = cva("flex flex-wrap items-center", {
  variants: {
    spacing: {
      default: "gap-[9px]",
      compact: "gap-[3px]",
    },
  },
  defaultVariants: {
    spacing: "default",
  },
});

type ButtonGroupProps = React.ComponentProps<"div"> &
  VariantProps<typeof buttonGroupVariants>;

function ButtonGroup({ className, spacing, ...props }: ButtonGroupProps) {
  return (
    <div
      className={cn(buttonGroupVariants({ spacing, className }))}
      {...props}
    />
  );
}

type ButtonGroupSeparatorProps = React.ComponentProps<"div">;

function ButtonGroupSeparator({
  className,
  ...props
}: ButtonGroupSeparatorProps) {
  return (
    <div
      className={cn(
        "size-[24px] flex items-center justify-center text-surface-foreground/50",
        className
      )}
      {...props}
    >
      <LineVerticalIcon size={12} />
    </div>
  );
}

ButtonGroup.Separator = ButtonGroupSeparator;

export { ButtonGroup };
