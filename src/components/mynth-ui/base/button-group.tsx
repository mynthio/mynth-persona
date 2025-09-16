import { cn } from "@/lib/utils";
import { LineVerticalIcon } from "@phosphor-icons/react/dist/ssr";

type ButtonGroupProps = React.ComponentProps<"div">;

function ButtonGroup({ className, ...props }: ButtonGroupProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-[12px]", className)}
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
