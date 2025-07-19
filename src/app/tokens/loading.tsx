import { MiniWaveLoader } from "@/components/ui/mini-wave-loader";

export default function TokensPageLoading() {
  return (
    <div className="flex items-center justify-center h-32">
      <MiniWaveLoader size="md" />
    </div>
  );
}
