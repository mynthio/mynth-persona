import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GradientColors {
  dark: {
    border: string;
    overlay: string;
    accent: string;
    text: string;
    glow: string;
    textGlow: string;
    hover: string;
  };
  light: {
    border: string;
    base: string;
    overlay: string;
    accent: string;
    text: string;
    glow: string;
    hover: string;
  };
}

interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
}

const colors: GradientColors = {
  dark: {
    border: "from-[#6B46C1] via-[#0C1F21] to-[#553C9A]",
    overlay: "from-[#7E22CE]/40 via-[#0C1F21] to-[#6B46C1]/30",
    accent: "from-[#E9D8FD]/10 via-[#0C1F21] to-[#44337A]/50",
    text: "from-[#E9D8FD] to-[#D6BCFA]",
    glow: "rgba(159,122,234,0.1)",
    textGlow: "rgba(159,122,234,0.4)",
    hover: "from-[#44337A]/20 via-[#B794F4]/10 to-[#44337A]/20",
  },
  light: {
    border: "from-purple-400 via-purple-300 to-purple-200",
    base: "from-purple-50 via-purple-50/80 to-purple-50/90",
    overlay: "from-purple-300/30 via-purple-200/20 to-purple-400/20",
    accent: "from-purple-400/20 via-purple-300/10 to-purple-200/30",
    text: "from-purple-700 to-purple-600",
    glow: "rgba(159,122,234,0.2)",
    hover: "from-purple-300/30 via-purple-200/20 to-purple-300/30",
  },
};

export default function GradientButton({
  children,
  className,
  ...props
}: GradientButtonProps) {
  return (
    <div className="group inline-block">
      <Button
        variant="ghost"
        className={cn(
          "relative h-10 px-4 rounded-md overflow-hidden transition-all duration-500",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-md p-[2px] bg-linear-to-b",
            "dark:bg-none",
            colors.light.border,
            colors.dark.border
          )}
        >
          <div
            className={cn(
              "absolute inset-0 rounded-md opacity-90",
              "bg-white/80",
              "dark:bg-[#0C1F21]"
            )}
          />
        </div>

        <div
          className={cn(
            "absolute inset-[2px] rounded-md opacity-95",
            "bg-white/80",
            "dark:bg-[#0C1F21]"
          )}
        />

        <div
          className={cn(
            "absolute inset-[2px] bg-linear-to-r rounded-md opacity-90",
            colors.light.base,
            "dark:from-[#0C1F21] dark:via-[#0C1F21] dark:to-[#0C1F21]"
          )}
        />
        <div
          className={cn(
            "absolute inset-[2px] bg-linear-to-b rounded-md opacity-80",
            colors.light.overlay,
            colors.dark.overlay
          )}
        />
        <div
          className={cn(
            "absolute inset-[2px] bg-linear-to-br rounded-md",
            colors.light.accent,
            colors.dark.accent
          )}
        />

        <div
          className={cn(
            "absolute inset-[2px] rounded-md",
            `shadow-[inset_0_0_10px_${colors.light.glow}]`,
            `dark:shadow-[inset_0_0_10px_${colors.dark.glow}]`
          )}
        />

        <div
          className={cn(
            "relative flex items-center justify-center gap-2 text-[0.87rem] bg-linear-to-b bg-clip-text text-transparent tracking-tighter",
            colors.light.text,
            colors.dark.text,
            `dark:drop-shadow-[0_0_12px_${colors.dark.textGlow}]`
          )}
        >
          {children}
        </div>

        <div
          className={cn(
            "absolute inset-[2px] opacity-0 transition-opacity duration-300 bg-linear-to-r hover:opacity-100 rounded-md",
            colors.light.hover,
            colors.dark.hover
          )}
        />
      </Button>
    </div>
  );
}
