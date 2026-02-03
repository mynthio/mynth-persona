"use client";

import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { PublicPersonaListItem } from "@/schemas/shared/persona-public.schema";
import { getImageUrl } from "@/lib/utils";
import { Link } from "@/components/ui/link";
import { ArrowRight } from "@untitledui/icons";
import {
  SignatureIcon,
  SealCheckIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr";

const FloatingLines = dynamic(() => import("@/components/FloatingLines"), {
  ssr: false,
});

interface HeroSectionProps {
  personas: PublicPersonaListItem[];
}

export function HeroSection({ personas }: HeroSectionProps) {
  const featured = personas.slice(0, 4);
  if (!featured.length) return null;

  return (
    <section className="relative w-full overflow-hidden bg-background z-0">
      {/* Atmospheric backdrop - unified with sidebar tones */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(145,120,255,0.28),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(197,122,255,0.18),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_35%,rgba(120,176,255,0.14),transparent_60%)]" />
      <div className="absolute -top-24 right-[-12%] h-[520px] w-[520px] rounded-full bg-primary/15 blur-[140px]" />
      <div className="absolute -bottom-40 left-[-10%] h-[520px] w-[520px] rounded-full bg-primary/10 blur-[170px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 md:px-16 pt-10 sm:pt-14 md:pt-16 pb-10 sm:pb-14 md:pb-16">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-[1.05fr_1.3fr] lg:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-xl h-full flex flex-col justify-center items-start"
          >
            {/* Badge - soft glass, consistent with sidebar */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground/70 shadow-[0_10px_30px_-18px_rgba(124,58,237,0.55)]">
              <SparkleIcon weight="fill" className="size-4 text-primary/90" />
              Discover Prsna's
            </div>

            <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground tracking-tight leading-[1.08]">
              Chat with anyone. <br />
              <span className="text-foreground/55 text-2xl sm:text-3xl md:text-4xl">
                About anything.
              </span>
            </h2>

            <p className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
              Dive into unfiltered, private conversations with AI that remembers
              you. Generate images mid-chat, explore wild scenarios, and enjoy
              total freedom.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/explore"
                className="group inline-flex items-center gap-3 rounded-full bg-primary px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_-16px_rgba(124,58,237,0.8)] ring-1 ring-primary/40 transition-all hover:translate-y-[-1px] hover:brightness-110"
              >
                Start Chatting
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/personas/creator"
                className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-card/50 px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-card/70 hover:text-foreground"
              >
                Create a Persona
              </Link>
            </div>

            {/* Feature cards - cleaner styling matching models-section */}
            <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
              {[
                { label: "Your story, your rules", value: "Total Privacy" },
                { label: "See your stories unfold", value: "Visual Chat" },
                { label: "Newest models added fast", value: "Bleeding Edge" },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border border-border/40 bg-card/40 px-3 py-3 transition-colors hover:border-border/70 hover:bg-card/70 ${
                    index === 2 ? "hidden sm:block" : ""
                  }`}
                >
                  <div className="text-foreground/90 font-semibold tracking-tight">
                    {item.value}
                  </div>
                  <div className="mt-1 text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 auto-rows-[minmax(250px,1fr)] sm:auto-rows-[minmax(220px,1fr)] lg:auto-rows-auto lg:grid-rows-2 h-auto lg:h-[calc(100vh-7.5rem)]">
            {featured.map((persona, index) => (
              <motion.div
                key={persona.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={`h-full ${index >= 2 ? "hidden sm:block" : ""}`}
              >
                <Link
                  href={`/personas/${persona.slug}`}
                  className="group relative block h-full overflow-hidden rounded-3xl border border-border/50 bg-card/30 transition-colors hover:bg-card/60"
                >
                  <div className="relative h-full">
                    <img
                      src={getImageUrl(persona.profileImageIdMedia)}
                      alt={persona.publicName}
                      className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
                  </div>

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {persona.status === "official" && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-amber-200">
                        <SignatureIcon weight="fill" className="size-3" />
                        Official
                      </span>
                    )}
                    {persona.status === "verified" && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-emerald-200">
                        <SealCheckIcon weight="fill" className="size-3" />
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                    <div className="flex w-full flex-col gap-0.5 text-white drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]">
                      <div className="text-xl sm:text-[1.35rem] font-bold tracking-tight leading-tight">
                        {persona.publicName}
                      </div>
                      <div className="text-[0.7rem] sm:text-xs text-white/80 line-clamp-2">
                        {persona.headline}
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-full border border-white/15 bg-black/50 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/85 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.6)]">
                        Open profile
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute hidden dark:block inset-0 h-full w-full -z-10">
        <FloatingLines
          linesGradient={["#E945F5", "#2F4BC0", "#E945F5"]}
          animationSpeed={1}
          interactive={false}
          bendRadius={5}
          bendStrength={-0.5}
          mouseDamping={0.05}
          parallax={false}
        />
      </div>
    </section>
  );
}
