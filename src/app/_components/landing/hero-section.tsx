"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PublicPersonaListItem } from "@/schemas/shared/persona-public.schema";
import { getImageUrl, cn } from "@/lib/utils";
import { Link } from "@/components/ui/link";
import { ArrowRight, Play } from "@untitledui/icons";
import {
  SignatureIcon,
  SealCheckIcon,
} from "@phosphor-icons/react/dist/ssr";

interface HeroSectionProps {
  personas: PublicPersonaListItem[];
}

export function HeroSection({ personas }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const featured = useMemo(() => personas.slice(0, 5), [personas]);

  useEffect(() => {
    if (featured.length === 0 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featured.length, isHovered]);

  const currentPersona = featured[currentIndex];

  if (!currentPersona) return null;

  return (
    <section
      className="relative w-full h-[100svh] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background images with crossfade */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentPersona.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <img
            src={getImageUrl(currentPersona.profileImageIdMedia)}
            alt=""
            className="w-full h-full object-cover object-top"
          />
        </motion.div>
      </AnimatePresence>

      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 pb-24 md:pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPersona.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              {currentPersona.status === "official" && (
                <span className="flex items-center gap-1.5 text-amber-400 text-xs font-medium uppercase tracking-wider">
                  <SignatureIcon weight="fill" className="size-4" />
                  Official
                </span>
              )}
              {currentPersona.status === "verified" && (
                <span className="flex items-center gap-1.5 text-teal-400 text-xs font-medium uppercase tracking-wider">
                  <SealCheckIcon weight="fill" className="size-4" />
                  Verified
                </span>
              )}
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[0.95] mb-4">
              {currentPersona.publicName}
            </h1>

            <p className="text-xl md:text-2xl text-white/70 font-light leading-relaxed mb-8 max-w-xl">
              {currentPersona.headline}
            </p>

            <Link
              href={`/personas/${currentPersona.slug}`}
              className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 hover:bg-white/90 transition-all duration-300 group"
            >
              <Play className="size-5" />
              Start Chatting
              <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Vertical progress indicators - right side */}
      <div className="absolute bottom-24 md:bottom-32 right-8 md:right-16 flex flex-col gap-2">
        {featured.map((persona, index) => (
          <button
            key={persona.id}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-1 h-12 rounded-full transition-all duration-500",
              index === currentIndex
                ? "bg-white"
                : "bg-white/30 hover:bg-white/50",
            )}
          />
        ))}
      </div>
    </section>
  );
}
