"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PersonaData } from "@/schemas";
import { useSidebar } from "@/components/ui/sidebar";

type BioDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PersonaData;
  displayName: string;
};

export function BioDialog(props: BioDialogProps) {
  const { isMobile } = useSidebar();

  return isMobile ? (
    <BioDialogMobile {...props} />
  ) : (
    <BioDialogDesktop {...props} />
  );
}

function BioDialogDesktop(props: BioDialogProps) {
  const { open, onOpenChange, data, displayName } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] h-[520px] max-h-[calc(100vh-3rem)]">
        <DialogHeader>
          <DialogTitle>{displayName}'s Bio</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full w-full">
          <div className="px-2">
            <BioContent data={data} />
          </div>
          <div className="h-[24px]"></div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function BioDialogMobile(props: BioDialogProps) {
  const { open, onOpenChange, data, displayName } = props;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader>
          <SheetTitle>{displayName}'s Bio</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-full min-h-0 shrink-0 mt-4">
          <div className="px-2">
            <BioContent data={data} />
          </div>
          <div className="h-[200px]" />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function BioContent({ data }: { data: PersonaData }) {
  return (
    <div className="flex flex-col gap-[24px]">
      {/* Summary */}
      {data.summary && (
        <BioSection title="Summary">
          <p className="text-surface-foreground/90 leading-relaxed">
            {data.summary}
          </p>
        </BioSection>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
        <BioSection title="Age">
          <p className="text-surface-foreground/90">{data.age}</p>
        </BioSection>

        <BioSection title="Gender">
          <p className="text-surface-foreground/90">{data.gender}</p>
        </BioSection>

        {data.occupation && (
          <BioSection title="Occupation">
            <p className="text-surface-foreground/90">{data.occupation}</p>
          </BioSection>
        )}
      </div>

      {/* Appearance */}
      <BioSection title="Appearance">
        <p className="text-surface-foreground/90 leading-relaxed whitespace-pre-wrap">
          {data.appearance}
        </p>
      </BioSection>

      {/* Personality */}
      <BioSection title="Personality">
        <p className="text-surface-foreground/90 leading-relaxed whitespace-pre-wrap">
          {data.personality}
        </p>
      </BioSection>

      {/* Background */}
      <BioSection title="Background">
        <p className="text-surface-foreground/90 leading-relaxed whitespace-pre-wrap">
          {data.background}
        </p>
      </BioSection>

      {/* Extensions */}
      {data.extensions && Object.keys(data.extensions).length > 0 && (
        <div className="space-y-[16px]">
          {Object.entries(data.extensions).map(([key, value]) => (
            <BioSection
              key={key}
              title={key.charAt(0).toUpperCase() + key.slice(1)}
            >
              <p className="text-surface-foreground/90 leading-relaxed whitespace-pre-wrap">
                {value}
              </p>
            </BioSection>
          ))}
        </div>
      )}
    </div>
  );
}

function BioSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <h3 className="font-onest text-[0.95rem] font-[600] text-surface-foreground/70 uppercase tracking-wide">
        {title}
      </h3>
      <div className="text-[0.95rem]">{children}</div>
    </div>
  );
}
