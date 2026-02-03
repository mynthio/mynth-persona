"use client";

import { motion } from "motion/react";
import { textGenerationModels } from "@/config/shared/models/text-generation-models.config";
import { Link } from "@/components/ui/link";
import { ArrowRight, Stars01 } from "@untitledui/icons";
import {
  LightningIcon,
  CrownIcon,
  LeafIcon,
} from "@phosphor-icons/react/dist/ssr";

type TierKey = "eco" | "standard" | "premium";

const tierMeta: Record<
  TierKey,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{
      className?: string;
      weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
    }>;
    accent: string;
    textColor: string;
    bgColor: string;
  }
> = {
  eco: {
    label: "Eco",
    description: "Good for quick chats. Efficient and versatile.",
    icon: LeafIcon,
    accent: "from-emerald-500/20 via-teal-500/10 to-transparent",
    textColor: "text-emerald-600 dark:text-emerald-300",
    bgColor: "bg-emerald-500/10",
  },
  standard: {
    label: "Standard",
    description: "The sweet spot for immersive, open-ended roleplay.",
    icon: Stars01,
    accent: "from-violet-500/20 via-purple-500/10 to-transparent",
    textColor: "text-violet-600 dark:text-violet-300",
    bgColor: "bg-violet-500/10",
  },
  premium: {
    label: "Premium",
    description: "Smartest models for long, complex stories.",
    icon: CrownIcon,
    accent: "from-amber-500/20 via-orange-500/10 to-transparent",
    textColor: "text-amber-600 dark:text-amber-300",
    bgColor: "bg-amber-500/10",
  },
};

const allModels = Object.values(textGenerationModels).filter(
  (model) => model.enabled,
);

const tierBuckets = allModels.reduce<Record<TierKey, typeof allModels>>(
  (acc, model) => {
    if (
      model.tier === "eco" ||
      model.tier === "standard" ||
      model.tier === "premium"
    ) {
      acc[model.tier].push(model);
    }
    return acc;
  },
  { eco: [], standard: [], premium: [] },
);

const featuredModels = {
  eco: tierBuckets.eco.slice(0, 3),
  standard: tierBuckets.standard.slice(0, 4),
  premium: tierBuckets.premium.slice(0, 3),
};

export function ModelsSection() {
  const ecoCount = tierBuckets.eco.length;
  const standardCount = tierBuckets.standard.length;
  const premiumCount = tierBuckets.premium.length;

  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-24 px-5 sm:px-6 md:px-16">
      {/* Subtle ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.14),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,rgba(16,185,129,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

      <div className="relative mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground/70 shadow-[0_12px_30px_-18px_rgba(124,58,237,0.35)]">
            <LightningIcon weight="fill" className="size-4 text-primary/80" />
            Model Roster
          </div>

          <h2 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground tracking-tight">
            Choose your partner
          </h2>
          <p className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            From quick chatters to deep thinkers. Pick the personality that fits
            your mood.
          </p>
        </motion.div>

        {/* Eco Tier Spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative rounded-3xl overflow-hidden border border-border/50 bg-card/40">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/12 via-teal-500/6 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.18),transparent_60%)]" />

            <div className="relative p-6 sm:p-8 md:p-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5">
                  <LeafIcon
                    weight="fill"
                    className="size-4 text-emerald-600 dark:text-emerald-300"
                  />
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-300">
                    Eco Tier
                  </span>
                </div>
                <span className="text-sm text-emerald-700/70 dark:text-emerald-300/70">
                  100 messages / 2h
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
                Jump right in
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6 max-w-lg">
                No paywall for basic fun. Test the waters, find a character you
                vibe with, and start chatting instantly.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {featuredModels.eco.map((model) => (
                  <span
                    key={model.modelId}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-700 dark:text-emerald-300"
                  >
                    {model.displayName}
                  </span>
                ))}
                {ecoCount > 3 && (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/5 px-3 py-1.5 text-sm text-emerald-700/60 dark:text-emerald-300/60">
                    +{ecoCount - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Standard & Premium Tiers */}
        <div className="space-y-4">
          {(["standard", "premium"] as TierKey[]).map((tier, index) => {
            const TierIcon = tierMeta[tier].icon;
            const count = tierBuckets[tier].length;

            return (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="group relative rounded-2xl border border-border/40 bg-card/30 hover:bg-card/60 transition-colors duration-300"
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`inline-flex items-center gap-2 rounded-full ${tierMeta[tier].bgColor} px-3 py-1.5`}
                      >
                        <TierIcon
                          weight="fill"
                          className={`size-4 ${tierMeta[tier].textColor}`}
                        />
                        <span
                          className={`text-sm font-medium ${tierMeta[tier].textColor}`}
                        >
                          {tierMeta[tier].label}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {count} models
                      </span>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm mb-4">
                    {tierMeta[tier].description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {featuredModels[tier].map((model) => (
                      <span
                        key={model.modelId}
                        className={`inline-flex items-center rounded-full ${tierMeta[tier].bgColor} px-3 py-1.5 text-sm ${tierMeta[tier].textColor}`}
                      >
                        {model.displayName}
                      </span>
                    ))}
                    {count > (tier === "standard" ? 4 : 3) && (
                      <span className="inline-flex items-center rounded-full bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
                        +{count - (tier === "standard" ? 4 : 3)} more
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground text-sm mb-4">
            Unlock higher limits and premium access
          </p>
          <Link
            href="/plans"
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold shadow-[0_18px_40px_-16px_rgba(124,58,237,0.45)] transition-transform hover:scale-[1.02]"
          >
            View Plans
            <ArrowRight className="size-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
