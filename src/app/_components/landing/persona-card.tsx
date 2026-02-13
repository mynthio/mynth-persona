"use client";

import { CheckmarkBadge02Icon, FemaleSymbolIcon, HeartCheckIcon, MaleSymbolIcon, PlayIcon, SignatureIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import { PublicPersonaListItem } from "@/schemas/shared/persona-public.schema";
import { getImageUrl, getVideoUrl, cn } from "@/lib/utils";
import { CreateChatButton } from "@/components/create-chat-button";

interface PersonaCardProps {
  persona: PublicPersonaListItem;
  index: number;
}

export function PersonaCard({ persona, index }: PersonaCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const hasVideo = Boolean(persona.profileSpotlightMediaId);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (hasVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [hasVideo]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <CreateChatButton
        personaId={persona.id}
        type="button"
        variant="ghost"
        className={cn(
          "group relative block w-full overflow-hidden rounded-3xl border border-border/50 bg-card/20 p-0 text-left whitespace-normal shadow-[0_20px_50px_-32px_rgba(0,0,0,0.6)] transition-colors hover:bg-card/30",
          "aspect-[3/4] sm:aspect-6/11 min-h-[260px] sm:min-h-[320px] lg:min-h-[340px]",
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image */}
        <img
          src={getImageUrl(persona.profileImageIdMedia)}
          alt={persona.publicName}
          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
        />

        {/* Video overlay - only rendered when hovered and has video */}
        {hasVideo && isHovered && (
          <video
            ref={videoRef}
            src={getVideoUrl(persona.profileSpotlightMediaId!)}
            poster={getImageUrl(persona.profileImageIdMedia)}
            muted
            playsInline
            preload="none"
            autoPlay
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

        {/* Status badge */}
        <div className="absolute top-4 left-4 flex gap-2">
          {persona.status === "official" && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 backdrop-blur-md text-amber-400 text-xs font-medium">
              <HugeiconsIcon icon={SignatureIcon} className="size-3" />
            </div>
          )}
          {persona.status === "verified" && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-teal-500/20 backdrop-blur-md text-teal-400 text-xs font-medium">
              <HugeiconsIcon icon={CheckmarkBadge02Icon} className="size-3" />
            </div>
          )}
        </div>

        {/* Gender indicator */}
        <div className="absolute top-4 right-4">
          {persona.gender === "female" ? (
            <div className="size-8 flex items-center justify-center rounded-full bg-pink-500/20 backdrop-blur-md text-pink-400">
              <HugeiconsIcon icon={FemaleSymbolIcon} className="size-4" />
            </div>
          ) : persona.gender === "male" ? (
            <div className="size-8 flex items-center justify-center rounded-full bg-blue-500/20 backdrop-blur-md text-blue-400">
              <HugeiconsIcon icon={MaleSymbolIcon} className="size-4" />
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 group-hover:text-white/90 transition-colors">
            {persona.publicName}
          </h3>
          <p className="text-xs sm:text-sm text-white/60 line-clamp-2 group-hover:text-white/70 transition-colors">
            {persona.headline}
          </p>

          {/* Likes */}
          <div className="flex items-center gap-1.5 mt-3 text-white/40 text-xs">
            <HugeiconsIcon icon={HeartCheckIcon} className="size-3.5" />
            {persona.likesCount.toLocaleString()}
          </div>
        </div>

        {/* Hover CTA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-black/50 text-white font-medium shadow-[0_10px_30px_-20px_rgba(0,0,0,0.6)]">
            <HugeiconsIcon icon={PlayIcon} className="size-5" />
            Create Chat
          </div>
        </div>
      </CreateChatButton>
    </motion.div>
  );
}
