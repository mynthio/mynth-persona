import { Loading02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";


export default function PersonaLoadingPage() {
  return (
    <div className="w-full h-full min-h-[80vh] flex items-center justify-center">
      <HugeiconsIcon icon={Loading02Icon} className="animate-spin" />
    </div>
  );
}
