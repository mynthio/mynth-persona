import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";

export default function PersonaLoadingPage() {
  return (
    <div className="w-full h-full min-h-[80vh] flex items-center justify-center">
      <CircleNotchIcon className="animate-spin" />
    </div>
  );
}
