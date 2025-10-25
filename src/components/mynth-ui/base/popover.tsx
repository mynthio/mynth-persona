import { cn } from "@/lib/utils";
import { Popover as PopoverPrimitive } from "@base-ui-components/react/popover";
import { Button } from "./button";

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

function PopoverPositioner({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Positioner>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        data-slot="popover-positioner"
        sideOffset={9}
        {...props}
        className={cn("z-popup", props.className)}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverPopup({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Popup> & {
  positioner?: React.ComponentProps<typeof PopoverPrimitive.Positioner>;
}) {
  return (
    <PopoverPrimitive.Popup
      data-slot="popover-popup"
      className={cn(
        "flex origin-[var(--transform-origin)] text-surface-foreground/60 flex-col rounded-[24px] bg-white p-[12px] text-sm shadow-xl shadow-surface-foreground/10 border-[3px] border-surface-100 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[instant]:duration-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300",
        className
      )}
      {...props}
    />
  );
}

function PopoverContent({ ...props }: React.ComponentProps<"div">) {
  return <div data-slot="popover-content" className="w-full" {...props} />;
}

function PopoverFooter({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className="w-full flex items-center justify-center mt-[12px]"
      {...props}
    />
  );
}

function PopoverSubmitButton({
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className="bg-background text-surface hover:text-surface hover:bg-background/90 w-full"
      {...props}
    />
  );
}

export {
  Popover,
  PopoverTrigger,
  PopoverPopup,
  PopoverPositioner,
  PopoverFooter,
  PopoverSubmitButton,
  PopoverContent,
};
