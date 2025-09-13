"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { usePersonaId } from "@/hooks/use-persona-id.hook";
import { usePersonaVersionQuery } from "@/app/_queries/use-persona-version.query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MiniWaveLoader } from "@/components/ui/mini-wave-loader";
import { Button } from "@/components/ui/button";
import { setPersonaCurrentVersion } from "@/actions/set-persona-current-version.action";
import { useSWRConfig } from "swr";

export default function PersonaVersionModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams<{ personaId: string }>();
  const versionId = searchParams.get("versionId");
  const isOpen = Boolean(versionId);
  const { mutate } = useSWRConfig();

  const personaId = params.personaId;

  const { data, isLoading } = usePersonaVersionQuery(
    personaId,
    (versionId as string) || undefined
  );

  const [isReverting, setIsReverting] = useState(false);

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("versionId");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const fields = useMemo(() => {
    if (!data) return [] as Array<{ label: string; value: string }>;
    const d = data.data;
    const dataFields: Array<{ label: string; value: string }> = [
      { label: "Name", value: d.name },
      { label: "Age", value: d.age },
      { label: "Gender", value: d.gender },
      { label: "Summary", value: d.summary },
      { label: "Appearance", value: d.appearance },
      { label: "Personality", value: d.personality },
      { label: "Background", value: d.background },
    ];
    if (d.occupation)
      dataFields.push({ label: "Occupation", value: d.occupation });
    if (d.extensions) {
      for (const [key, value] of Object.entries(d.extensions)) {
        dataFields.push({ label: key, value });
      }
    }

    return dataFields;
  }, [data]);

  const handleRevert = async () => {
    if (!personaId || !versionId) return;
    setIsReverting(true);
    try {
      await setPersonaCurrentVersion(personaId, versionId);
      // refresh persona and current version
      await Promise.all([
        mutate(`/api/personas/${personaId}`),
        mutate(`/api/personas/${personaId}/versions/current`),
      ]);
      handleClose();
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => (open ? null : handleClose())}
    >
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {data ? data.title || `Version ${data.versionNumber}` : "Version"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-5">
            <MiniWaveLoader size="md" aria-label="Loading version" />
          </div>
        ) : data ? (
          <div className="space-y-4 max-h-[60vh] overflow-auto pr-1">
            {fields.map((f) => (
              <div key={`${f.label}`} className="space-y-1">
                <div className="font-semibold">{f.label}</div>
                <div className="text-sm whitespace-pre-wrap break-words">
                  {f.value || "—"}
                </div>
              </div>
            ))}

            <div className="pt-2">
              <Button onClick={handleRevert} disabled={isReverting}>
                {isReverting ? "Reverting…" : "Revert to this version"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Version not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
