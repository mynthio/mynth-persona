"use client";

import { motion } from "motion/react";
import { Stars01 } from "@untitledui/icons";
import { PrsnaToolbar } from "../prsna-toolbar";

export function CreateSection() {
  return (
    <section className="relative py-20 md:py-32 pb-12 md:pb-16 px-5 sm:px-6 md:px-16 overflow-hidden bg-black">
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-pink-500/20 rounded-full blur-[128px] animate-pulse delay-1000" />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 text-violet-400 text-sm font-medium mb-6">
            <Stars01 className="size-4" strokeWidth={2} />
            Limitless Creation
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
            Build your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400">
              perfect prsna.
            </span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-white/50 mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed">
            Sarcastic, sweet, or mysterious? You decide. Craft the perfect
            companion with detailed traits, private quirks, and a style
            that&apos;s all yours.
          </p>

          {/* Integrated toolbar */}
          <PrsnaToolbar className="static md:sticky bottom-auto z-10" />
        </motion.div>
      </div>
    </section>
  );
}
