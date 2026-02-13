"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import { PublicPersonaListItem } from "@/schemas/shared/persona-public.schema";
import { Link } from "@/components/ui/link";
import { PersonaCard } from "./persona-card";

interface PersonasSectionProps {
  title: string;
  subtitle: string;
  personas: PublicPersonaListItem[];
  viewAllHref?: string;
}

export function PersonasSection({
  title,
  subtitle,
  personas,
  viewAllHref,
}: PersonasSectionProps) {
  if (!personas.length) return null;

  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-24 px-5 sm:px-6 md:px-16">
      {/* Ambient background to match hero/models sections */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(124,58,237,0.16),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_85%,rgba(236,72,153,0.14),transparent_55%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground/70 shadow-[0_12px_30px_-18px_rgba(124,58,237,0.35)]">
              Latest Personas
            </div>
            <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground tracking-tight">
              {title}
            </h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base max-w-xl">
              {subtitle}
            </p>
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="hidden md:flex shrink-0 items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              View all
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {personas.slice(0, 8).map((persona, index) => (
            <PersonaCard key={persona.id} persona={persona} index={index} />
          ))}
        </div>

        {viewAllHref && (
          <div className="mt-8 text-center md:hidden">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
