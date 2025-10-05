import * as React from "react";

import { cn } from "@/lib/utils";
import { Field as FieldPrimitive } from "@base-ui-components/react/field";

function FieldRoot({ className, ...props }: React.ComponentProps<typeof FieldPrimitive.Root>) {
  return (
    <FieldPrimitive.Root
      data-slot="field-root"
      className={cn(className)}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof FieldPrimitive.Label>) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={cn(className)}
      {...props}
    />
  );
}

function FieldControl({ className, ...props }: React.ComponentProps<typeof FieldPrimitive.Control>) {
  return (
    <FieldPrimitive.Control
      data-slot="field-control"
      className={cn(className)}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<typeof FieldPrimitive.Description>) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={cn(className)}
      {...props}
    />
  );
}

function FieldError({ className, ...props }: React.ComponentProps<typeof FieldPrimitive.Error>) {
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      className={cn(className)}
      {...props}
    />
  );
}

function FieldValidity(props: React.ComponentProps<typeof FieldPrimitive.Validity>) {
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