import * as React from "react";

import { cn } from "@/lib/utils";
import { Form as FormPrimitive } from "@base-ui-components/react/form";
import { Field as FieldPrimitive } from "@base-ui-components/react/field";

function Form({ ...props }: React.ComponentProps<typeof FormPrimitive>) {
  return <FormPrimitive data-slot="form" {...props} />;
}

function FieldRoot({
  className,
  ...props
}: React.ComponentProps<typeof FieldPrimitive.Root>) {
  return (
    <FieldPrimitive.Root
      data-slot="field-root"
      className={cn("flex flex-col gap-[3px]", className)}
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
        "text-[0.75rem] text-surface-foreground/60 font-onest font-[500] px-[6px]",
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

function FieldError({
  className,
  ...props
}: React.ComponentProps<typeof FieldPrimitive.Error>) {
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
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
        "text-[0.75rem] text-surface-foreground/60 px-[6px]",
        className
      )}
      {...props}
    />
  );
}

const Field = {
  Root: FieldRoot,
  Label: FieldLabel,
  Control: FieldControl,
  Error: FieldError,
  Description: FieldDescription,
};

export { Form, Field };
