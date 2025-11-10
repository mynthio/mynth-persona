import { SparkleIcon } from "@phosphor-icons/react/dist/ssr";

export function BetaImageLimitBanner() {
  return (
    <div className="max-w-[600px] w-[90%] mx-auto bg-surface-100 border border-surface-200 rounded-[24px] px-[12px] py-[8px]">
      <div className="flex items-start justify-center gap-[12px]">
        <SparkleIcon size={20} className="text-black shrink-0 mt-[2px]" />

        <p className="w-full text-[0.85rem] text-left text-surface-foreground leading-relaxed">
          <span className="font-semibold text-black">Beta:</span> All plans get{" "}
          <strong>30 daily credits</strong> for message images (~30 standard or
          ~15 premium) while we improve the feature.
        </p>
      </div>
    </div>
  );
}
