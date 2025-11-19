import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
}

export default function GradientButton({
  children,
  className,
  ...props
}: GradientButtonProps) {
  return (
    <div className="group/gradientbutton inline-block">
      <Button
        variant="ghost"
        className={cn(
          "relative h-9 px-4 rounded-md overflow-hidden transition-all duration-500",
          className
        )}
        {...props}
      >
        {/* Border gradient layer */}
        <div className="absolute inset-0 rounded-md p-[2px] bg-linear-to-b from-primary/60 via-border to-primary/40 dark:from-secondary/50 dark:via-card dark:to-primary/30">
          <div className="absolute inset-0 rounded-md bg-card/90 dark:bg-card/95" />
        </div>

        {/* Base background */}
        <div className="absolute inset-[2px] rounded-md bg-card/95 dark:bg-card" />

        {/* Light mode subtle gradient */}
        <div className="absolute inset-[2px] bg-linear-to-r rounded-md opacity-90 from-accent/10 via-card/80 to-accent/5 dark:from-card dark:via-card dark:to-card" />

        {/* Overlay gradient for depth */}
        <div className="absolute inset-[2px] bg-linear-to-b rounded-md opacity-80 from-primary/10 via-transparent to-secondary/5 dark:from-secondary/20 dark:via-card dark:to-primary/10" />

        {/* Accent highlight */}
        <div className="absolute inset-[2px] bg-linear-to-br rounded-md from-primary/5 via-transparent to-accent/10 dark:from-accent/5 dark:via-card dark:to-secondary/20" />

        {/* Subtle inner glow */}
        <div className="absolute inset-[2px] rounded-md shadow-[inset_0_0_10px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_0_10px_rgba(255,255,255,0.03)]" />

        {/* Text content with gradient */}
        <div className="relative flex items-center justify-center gap-2 text-[0.87rem] font-montserrat font-normal bg-linear-to-b from-primary/70 to-primary/50 bg-clip-text text-transparent tracking-tight dark:from-primary-foreground/70 dark:to-secondary-foreground/50">
          {children}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-[2px] opacity-0 transition-opacity duration-300 group-hover/gradientbutton:opacity-100 bg-linear-to-r rounded-md from-primary/10 via-accent/5 to-primary/10 dark:from-secondary/10 dark:via-ring/5 dark:to-secondary/10" />
      </Button>
    </div>
  );
}
