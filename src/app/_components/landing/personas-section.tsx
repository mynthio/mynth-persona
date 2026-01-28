"use client";

import { motion } from "motion/react";
import { PublicPersonaListItem } from "@/schemas/shared/persona-public.schema";
import { Link } from "@/components/ui/link";
import { ArrowRight } from "@untitledui/icons";
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
    <section className="relative py-20 px-8 md:px-16 bg-black">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              {title}
            </h2>
            <p className="text-white/50 mt-2">{subtitle}</p>
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="hidden md:flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
            >
              View all
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {personas.slice(0, 8).map((persona, index) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              index={index}
              size={index < 2 ? "large" : "default"}
            />
          ))}
        </div>

        {viewAllHref && (
          <div className="mt-8 text-center md:hidden">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              View all
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
