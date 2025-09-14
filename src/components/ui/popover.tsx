import { cn } from "@/lib/utils";
import { Popover as PopoverPrimitive } from "@base-ui-components/react/popover";

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverPopup({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Popup> & {
  positioner?: React.ComponentProps<typeof PopoverPrimitive.Positioner>;
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        sideOffset={9}
        className="z-10 select-none"
        {...props.positioner}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-popup"
          className={cn(
            "flex origin-[var(--transform-origin)] text-surface-foreground/60 flex-col rounded-[16px] bg-surface p-[12px] text-sm shadow-lg shadow-surface-100 outline-[2px] outline-surface-100 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[instant]:duration-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverPopup };
