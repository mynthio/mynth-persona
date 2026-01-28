"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import { PublicPersonaListItem } from "@/schemas/shared/persona-public.schema";
import { getImageUrl, getVideoUrl, cn } from "@/lib/utils";
import { Link } from "@/components/ui/link";
import { Play } from "@untitledui/icons";
import {
  GenderFemaleIcon,
  GenderMaleIcon,
  HeartIcon,
  SealCheckIcon,
  SignatureIcon,
} from "@phosphor-icons/react/dist/ssr";

interface PersonaCardProps {
  persona: PublicPersonaListItem;
  index: number;
  size?: "default" | "large" | "small";
}

const heights = {
  large: "h-[500px]",
  default: "h-[400px]",
  small: "h-[320px]",
} as const;

export function PersonaCard({ persona, index, size = "default" }: PersonaCardProps) {
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
      <Link
        href={`/personas/${persona.slug}`}
        className={cn(
          "relative block rounded-3xl overflow-hidden group",
          heights[size],
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
              <SignatureIcon weight="fill" className="size-3" />
            </div>
          )}
          {persona.status === "verified" && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-teal-500/20 backdrop-blur-md text-teal-400 text-xs font-medium">
              <SealCheckIcon weight="fill" className="size-3" />
            </div>
          )}
        </div>

        {/* Gender indicator */}
        <div className="absolute top-4 right-4">
          {persona.gender === "female" ? (
            <div className="size-8 flex items-center justify-center rounded-full bg-pink-500/20 backdrop-blur-md text-pink-400">
              <GenderFemaleIcon className="size-4" />
            </div>
          ) : persona.gender === "male" ? (
            <div className="size-8 flex items-center justify-center rounded-full bg-blue-500/20 backdrop-blur-md text-blue-400">
              <GenderMaleIcon className="size-4" />
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-white/90 transition-colors">
            {persona.publicName}
          </h3>
          <p className="text-sm text-white/60 line-clamp-2 group-hover:text-white/70 transition-colors">
            {persona.headline}
          </p>

          {/* Likes */}
          <div className="flex items-center gap-1.5 mt-3 text-white/40 text-xs">
            <HeartIcon weight="fill" className="size-3.5" />
            {persona.likesCount.toLocaleString()}
          </div>
        </div>

        {/* Hover CTA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md text-white font-medium">
            <Play className="size-5" />
            Chat Now
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
