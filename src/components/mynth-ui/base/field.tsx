import * as React from "react";

import { cn } from "@/lib/utils";
import { Field as FieldPrimitive } from "@base-ui-components/react/field";

function FieldRoot({
  className,
  ...props
}: React.ComponentProps<typeof FieldPrimitive.Root>) {
  return (
    <FieldPrimitive.Root
      data-slot="field-root"
      className={cn("flex flex-col items-start gap-[4px]", className)}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof FieldPrimitive.Label>) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={cn(
        "text-[0.8rem] font-[600] font-onest text-surface-foreground/50 ml-[2px]",
        className
      )}
      {...props}
    />
  );
}

function FieldControl({
  className,
  ...props
}: React.ComponentProps<typeof FieldPrimitive.Control>) {
  return (
    <FieldPrimitive.Control
      data-slot="field-control"
      className={cn(className)}
      {...props}
    />
  );
}

function FieldDescription({
  className,
  ...props
}: React.ComponentProps<typeof FieldPrimitive.Description>) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={cn(
        "text-[0.75rem] font-[400] ml-[2px] max-w-11/12 text-surface-foreground/50",
        className
      )}
      {...props}
    />
  );
}

function FieldError({
  className,
  ...props
}: React.ComponentProps<typeof FieldPrimitive.Error>) {
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      className={cn(
        "text-rose-700 bg-rose-100/50 px-[6px] py-[2px] rounded-[8px] text-[0.85rem] w-full font-[400] font-onest",
        className
      )}
      {...props}
    />
  );
}

function FieldValidity(
  props: React.ComponentProps<typeof FieldPrimitive.Validity>
) {
  return <FieldPrimitive.Validity data-slot="field-validity" {...props} />;
}

const Field = {
  Root: FieldRoot,
  Label: FieldLabel,
  Control: FieldControl,
  Description: FieldDescription,
  Error: FieldError,
  Validity: FieldValidity,
};

export { Field };
