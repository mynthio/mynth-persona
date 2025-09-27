import * as React from "react";

import { cn } from "@/lib/utils";
import { Fieldset as FieldsetPrimitive } from "@base-ui-components/react/fieldset";

function FieldsetRoot({ className, ...props }: React.ComponentProps<typeof FieldsetPrimitive.Root>) {
  return (
    <FieldsetPrimitive.Root
      data-slot="fieldset-root"
      className={cn(className)}
      {...props}
    />
  );
}

function FieldsetLegend({ className, ...props }: React.ComponentProps<typeof FieldsetPrimitive.Legend>) {
  return (
    <FieldsetPrimitive.Legend
      data-slot="fieldset-legend"
      className={cn(className)}
      {...props}
    />
  );
}

const Fieldset = {
  Root: FieldsetRoot,
  Legend: FieldsetLegend,
};

export { Fieldset };