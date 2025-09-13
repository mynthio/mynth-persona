import { ReactNode } from "react";

type WorkbenchLayoutProps = {
  children: ReactNode;
};

export default function WorkbenchLayout(props: WorkbenchLayoutProps) {
  return (
    <div className="flex w-full max-w-full h-full md:pr-[420px] [&>div]:min-h-0 [&>div]:last:shrink-0">
      {props.children}
    </div>
  );
}
