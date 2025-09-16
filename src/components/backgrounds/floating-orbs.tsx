"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

type Props = {
  className?: string;
};

export default function FloatingOrbs({ className }: Props) {
  return (
    <div
      className={cn(
        "w-full h-full relative overflow-hidden pointer-events-none motion-reduce:hidden",
        className
      )}
      aria-hidden="true"
      role="presentation"
    >
      {/* Violet orb */}
      <motion.div
        className="absolute rounded-full opacity-15 blur-3xl"
        style={{
          width: "550px",
          height: "550px",
          background:
            "radial-gradient(circle, #8b5cf6 0%, #a855f7 50%, transparent 70%)",
          top: "-200px",
          left: "50px",
        }}
        animate={{
          y: [-20, -120, -60, -180, -80, -20],
          x: [0, 80, -60, 40, 100, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Purple orb */}
      <motion.div
        className="absolute rounded-full opacity-10 blur-3xl"
        style={{
          width: "660px",
          height: "660px",
          background:
            "radial-gradient(circle, #9333ea 0%, #7c3aed 50%, transparent 70%)",
          top: "-350px",
          left: "350px",
        }}
        animate={{
          y: [0, -140, -70, -200, -100, 0],
          x: [-80, 60, -40, 80, -60, -80],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Navy orb */}
      <motion.div
        className="absolute rounded-full opacity-20 blur-3xl"
        style={{
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle, #1e40af 0%, #1d4ed8 50%, transparent 70%)",
          top: "-200px",
          right: "0px",
        }}
        animate={{
          y: [-10, -100, -130, -80, -220, -10],
          x: [-70, 50, -90, 20, -50, -70],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
