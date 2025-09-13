"use client";

import WorkbenchLayout from "@/app/_components/workbench/workbench-layout";
import WorkbenchContent from "@/app/_components/workbench/workbench-content";
import WorkbenchSidebar from "@/app/_components/workbench/workbench-sidebar";

export default function WorkbenchPageClient() {
  return (
    <WorkbenchLayout>
      <WorkbenchContent />
      <WorkbenchSidebar />
    </WorkbenchLayout>
  );
}
