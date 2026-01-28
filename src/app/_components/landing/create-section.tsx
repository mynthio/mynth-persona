"use client";

import { motion } from "motion/react";
import { Stars01 } from "@untitledui/icons";
import { PrsnaToolbar } from "../prsna-toolbar";

export function CreateSection() {
  return (
    <section className="relative py-32 pb-16 px-8 md:px-16 overflow-hidden bg-black">
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[128px] animate-pulse delay-1000" />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 text-violet-400 text-sm font-medium mb-6">
            <Stars01 className="size-4" strokeWidth={2} />
            AI-Powered Creation
          </div>

          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
            Bring your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400">
              imagination
            </span>{" "}
            to life
          </h2>

          <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
            Describe your perfect companion and watch as AI crafts a unique
            persona just for you.
          </p>

          {/* Integrated toolbar */}
          <PrsnaToolbar className="relative bottom-auto z-10" />
        </motion.div>
      </div>
    </section>
  );
}
