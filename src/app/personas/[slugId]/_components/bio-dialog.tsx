"use client";

import { Dialog } from "@base-ui-components/react/dialog";
import { XIcon } from "@phosphor-icons/react/dist/ssr";
import { ScrollArea } from "@/components/mynth-ui/base/scroll-area";
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
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-overlay bg-background/20 backdrop-blur-[1px] transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[starting-style]:backdrop-blur-none dark:opacity-70" />
        <Dialog.Popup
          className="fixed z-dialog left-1/2 -mt-8 w-[800px] max-w-[calc(100vw-3rem)] h-[520px] max-h-[calc(100vh-3rem)]
            -translate-x-1/2 -translate-y-1/2 
            outline-[3px] outline-background/5
            top-[calc(50%+1.25rem*var(--nested-dialogs))] scale-[calc(1-0.03*var(--nested-dialogs))] data-[nested-dialog-open]:grayscale-100 data-[nested-dialog-open]:after:absolute data-[nested-dialog-open]:after:inset-0 data-[nested-dialog-open]:after:rounded-[inherit] data-[nested-dialog-open]:after:bg-background/10 data-[nested-dialog-open]:after:backdrop-blur-[1px] 
            rounded-[32px] bg-surface p-[12px] px-[24px] text-surface-foreground transition-all duration-250 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0
            flex flex-col 
            "
        >
          <div className="flex shrink-0 justify-between px-[12px] mb-[12px] mt-[6px]">
            <Dialog.Title className="font-onest text-[1.2rem] font-[600] py-[12px]">
              {displayName}'s Bio
            </Dialog.Title>
            <Dialog.Close className="size-[36px] flex items-center justify-center transition-colors duration-150 hover:bg-surface-100 rounded-[12px]">
              <XIcon />
            </Dialog.Close>
          </div>

          <ScrollArea className="h-full w-full">
            <div className="px-[12px] pr-[24px]">
              <BioContent data={data} />
            </div>
            <div className="h-[24px]"></div>
          </ScrollArea>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function BioDialogMobile(props: BioDialogProps) {
  const { open, onOpenChange, data, displayName } = props;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-overlay bg-background/20 backdrop-blur-[1px] transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[starting-style]:backdrop-blur-none dark:opacity-70" />
        <Dialog.Popup
          className="fixed z-dialog left-0 right-0 bottom-0 w-full max-w-[100vw] h-auto min-h-auto max-h-[70vh]
            rounded-t-[24px] bg-surface text-surface-foreground transition-all duration-250
            scale-[calc(1-0.03*var(--nested-dialogs))] data-[nested-dialog-open]:after:absolute data-[nested-dialog-open]:after:inset-0 data-[nested-dialog-open]:after:rounded-[inherit] data-[nested-dialog-open]:after:bg-background/10 data-[nested-dialog-open]:after:backdrop-blur-[1px] 
            data-[ending-style]:translate-y-[8%] data-[ending-style]:opacity-0 data-[starting-style]:translate-y-[8%] data-[starting-style]:opacity-0"
        >
          <div className="flex shrink-0 justify-between px-[24px] mb-[12px] mt-[6px]">
            <Dialog.Title className="font-onest text-[1.2rem] font-[600] py-[12px]">
              {displayName}'s Bio
            </Dialog.Title>
            <Dialog.Close className="size-[36px] flex items-center justify-center transition-colors duration-150 hover:bg-surface-100 rounded-[12px]">
              <XIcon />
            </Dialog.Close>
          </div>

          <ScrollArea className="h-full min-h-0 shrink-0">
            <div className="px-[24px]">
              <BioContent data={data} />
            </div>
            <div className="h-[200px]" />
          </ScrollArea>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
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
