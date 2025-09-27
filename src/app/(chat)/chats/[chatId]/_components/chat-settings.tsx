"use client";

import { Dialog } from "@base-ui-components/react/dialog";
import { useSettingsNavigation } from "../_hooks/use-settings-navigation.hook";
import { Field, Form } from "@/components/mynth-ui/base/form";
import { TextareaAutosize } from "@/components/ui/textarea";
import { useSidebar } from "@/components/ui/sidebar";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  FeatherIcon,
  GearSixIcon,
  UserSquareIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Input } from "@/components/mynth-ui/base/input";
import { Button } from "@/components/mynth-ui/base/button";
import { AlertDialog } from "@base-ui-components/react/alert-dialog";

type ChatSettingsProps = {
  defaultOpen: boolean;
};

export function ChatSettings(props: ChatSettingsProps) {
  const { isMobile } = useSidebar();

  return isMobile ? (
    <ChatSettingsMobile defaultOpen={props.defaultOpen} />
  ) : (
    <ChatSettingsDesktop defaultOpen={props.defaultOpen} />
  );
}

type ChatSettingsDesktopProps = {
  defaultOpen: boolean;
};

function ChatSettingsDesktop(props: ChatSettingsDesktopProps) {
  const { areSettingsOpen, closeSettings } = useSettingsNavigation();

  return (
    <Dialog.Root
      defaultOpen={props.defaultOpen}
      open={areSettingsOpen}
      onOpenChange={closeSettings}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-overlay bg-background/20 backdrop-blur-[1px] transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[starting-style]:backdrop-blur-none dark:opacity-70" />
        <Dialog.Popup
          className="fixed z-dialog top-1/2 left-1/2 -mt-8 w-[800px] max-w-[calc(100vw-3rem)]  h-[460px] max-h-[calc(100vh-3rem)]
            -translate-x-1/2 -translate-y-1/2 
            outline-[3px] outline-background/5
            scale-[calc(1-0.05*var(--nested-dialogs))] data-[nested-dialog-open]:after:absolute data-[nested-dialog-open]:after:inset-0 data-[nested-dialog-open]:after:rounded-[inherit] data-[nested-dialog-open]:after:bg-black/5 
            rounded-[32px] bg-surface p-[12px] px-[24px] text-surface-foreground transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0
            "
        >
          <div className="flex justify-between px-[12px] mb-[12px] mt-[6px]">
            <Dialog.Title className="font-onest text-[1.2rem] font-[600] py-[12px]">
              Chat
            </Dialog.Title>
            <Dialog.Close className="size-[36px] flex items-center justify-center transition-colors duration-150 hover:bg-surface-100 rounded-[12px]">
              <XIcon />
            </Dialog.Close>
          </div>

          <div className="flex gap-[36px]">
            <ChatSettingsMenu />
            <ChatSettingsContent />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type ChatSettingsMobileProps = {
  defaultOpen: boolean;
};

function ChatSettingsMobile(props: ChatSettingsMobileProps) {
  const { areSettingsOpen, closeSettings, current } = useSettingsNavigation();

  return (
    <Drawer
      defaultOpen={props.defaultOpen}
      open={areSettingsOpen}
      onClose={closeSettings}
    >
      <DrawerContent>
        <DrawerTitle className="sr-only">Chat Settings</DrawerTitle>

        {current === "_" ? (
          <ChatSettingsMenu />
        ) : (
          <div className="mt-[24px] min-h-[240px] px-[24px]">
            <ChatSettingsContent />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function ChatSettingsContent() {
  const { current } = useSettingsNavigation();

  const contentComponent = useMemo(() => {
    switch (current) {
      case "settings":
        return <ChatSettingsHome />;
      case "user":
        return <ChatSettingsUser />;
      case "scenario":
        return <ChatSettingsScenario />;
      default:
        return <ChatSettingsHome />;
    }
  }, [current]);

  return (
    <div className="relative flex-1 w-full max-w-[460px]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="w-full h-full"
        >
          {contentComponent}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ChatSettingsMenu() {
  const { areSettingsOpen, closeSettings, navigateSettings, current } =
    useSettingsNavigation();

  return (
    <div className="flex flex-col justify-start gap-[1px] shrink-0 grow-0 md:w-[220px] px-[24px] md:px-[0px] py-[24px] md:py-0">
      <MenuButton
        onClick={() => navigateSettings("settings")}
        isActive={current === "settings"}
      >
        <GearSixIcon />
        Settings
      </MenuButton>
      <MenuButton
        onClick={() => navigateSettings("user")}
        isActive={current === "user"}
      >
        <UserSquareIcon />
        My persona
      </MenuButton>
      <MenuButton
        onClick={() => navigateSettings("scenario")}
        isActive={current === "scenario"}
      >
        <FeatherIcon />
        Scenario
      </MenuButton>

      <MenuButton className="text-red-500 md:hidden" onClick={closeSettings}>
        <XIcon /> Close
      </MenuButton>
    </div>
  );
}

function MenuButton(props: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex justify-start items-center gap-[6px] h-[60px] md:h-[46px] w-full px-[12px] text-surface-foreground hover:bg-surface-100 rounded-[18px] md:rounded-[16px] transition-all duration-100",
        props.isActive && "bg-surface-100/50",
        props.className
      )}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

function ChatSettingsHome() {
  return (
    <div>
      <div className="flex items-center justify-between gap-[32px]">
        <div className="flex flex-col gap-[2px]">
          <p className="text-[0.9rem] text-surface-foreground">
            Delete Chat? This action cannot be undone.
          </p>
          <p className="text-[0.75rem] text-surface-foreground/80">
            This action can't be undone. All messages will be removed.
            <br />
            You will confirm it in next step.
          </p>
        </div>

        <AlertDialog.Root>
          <AlertDialog.Trigger
            render={
              <Button className="shrink-0 outline-[1px] outline-red-200 text-red-600">
                Delete
              </Button>
            }
          />
          <AlertDialog.Portal>
            <AlertDialog.Backdrop className="fixed inset-0 bg-background/20 z-overlay transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-70" />
            <AlertDialog.Popup className="fixed top-1/2 left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gray-50 p-6 text-gray-900 outline outline-1 outline-gray-200 transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:outline-gray-300">
              <AlertDialog.Title className="-mt-1.5 mb-1 text-lg font-medium">
                Delete chat?
              </AlertDialog.Title>
              <AlertDialog.Description className="mb-6 text-base text-gray-600">
                You can’t undo this action.
              </AlertDialog.Description>
              <div className="flex justify-end gap-4">
                <AlertDialog.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                  Cancel
                </AlertDialog.Close>
                <AlertDialog.Close className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-red-800 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
                  Delete
                </AlertDialog.Close>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>
    </div>
  );
}

function ChatSettingsUser() {
  return <div>User</div>;
}

function ChatSettingsScenario() {
  return <div>Scenario</div>;
}

function ChatSettingsForm() {
  return (
    <Form>
      <Field.Root>
        <Field.Label>Scenario</Field.Label>

        <TextareaAutosize
          name="scenario"
          minRows={3}
          placeholder="Custom scenario for chat"
          className="bg-white border-[2px] border-zinc-100 rounded-[16px]"
        />

        <Field.Description>
          Scenario will be included inside chat instructions. It will be always
          included to the context. You can change/modify or remove scenario at
          any time.
        </Field.Description>
      </Field.Root>
    </Form>
  );
}
