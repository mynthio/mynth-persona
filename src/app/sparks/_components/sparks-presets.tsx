"use client";

import { useMemo } from "react";
import { getSparksPresetsList, type SparkPreset } from "@/config/shared/sparks";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard.hook";
import { Button } from "@/components/mynth-ui/base/button";
import { ButtonGroup } from "@/components/mynth-ui/base/button-group";
import { createCheckoutAction } from "@/actions/create-checkout.action";

export function SparksPresets() {
  const presets = useMemo(() => getSparksPresetsList(), []);

  return (
    <div className="flex flex-col items-center gap-[12px]">
      <p className="font-mono text-center">Choose a sparks pack</p>

      <div className="flex flex-col items-center gap-[8px]">
        <ButtonGroup className="justify-center">
          {presets.map((p: SparkPreset) => (
            <form key={p.key} action={createCheckoutAction}>
              <input type="hidden" name="preset" value={p.key} />
              <Button color="primary" type="submit">
                {p.name} • {p.priceUSD.toFixed(2)}$
              </Button>
            </form>
          ))}
        </ButtonGroup>
      </div>
    </div>
  );
}
