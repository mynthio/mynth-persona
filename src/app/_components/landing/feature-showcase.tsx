"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import {
  BrainIcon,
  ChatCircleIcon,
  PaletteIcon,
} from "@phosphor-icons/react/dist/ssr";

export function FeatureShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section className="relative py-32 bg-black overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-8 md:px-16">
        {/* Large typography intro */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-24"
        >
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[0.9]">
            This is
            <br />
            <span className="text-white/20">your world</span>
          </h2>
        </motion.div>

        {/* Feature blocks - staggered layout */}
        <div ref={containerRef} className="grid md:grid-cols-2 gap-8 md:gap-16">
          {/* Feature 1 - Large */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="md:col-span-2 relative group"
          >
            <div className="relative p-10 md:p-16 rounded-[40px] bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.15),transparent_60%)]" />
              <div className="absolute top-8 right-8 md:top-16 md:right-16">
                <BrainIcon
                  weight="duotone"
                  className="size-16 md:size-24 text-violet-400/40"
                />
              </div>
              <div className="relative">
                <div className="text-violet-400 text-sm font-medium uppercase tracking-widest mb-4">
                  AI Personas
                </div>
                <h3 className="text-3xl md:text-5xl font-bold text-white mb-4 max-w-xl leading-tight">
                  Deep & Responsive
                </h3>
                <p className="text-lg md:text-xl text-white/50 max-w-xl leading-relaxed">
                  Real conversations that adapt to you. Our personas have rich
                  backstories and distinct personalities—ready to follow your
                  lead wherever it goes.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative group"
          >
            <div className="relative h-full p-10 rounded-[32px] bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(244,63,94,0.1),transparent_60%)]" />
              <div className="absolute bottom-6 right-6">
                <ChatCircleIcon
                  weight="duotone"
                  className="size-12 text-rose-400/30"
                />
              </div>
              <div className="relative">
                <div className="text-rose-400 text-sm font-medium uppercase tracking-widest mb-4">
                  Immersive Chat
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                  Unbound Storytelling
                </h3>
                <p className="text-white/50 leading-relaxed">
                  Experience natural dialogue that flows effortlessly. Whether
                  it&apos;s a heartfelt confession or a wild adventure, explore
                  any narrative you desire.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative group"
          >
            <div className="relative h-full p-10 rounded-[32px] bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.1),transparent_60%)]" />
              <div className="absolute bottom-6 right-6">
                <PaletteIcon
                  weight="duotone"
                  className="size-12 text-amber-400/30"
                />
              </div>
              <div className="relative">
                <div className="text-amber-400 text-sm font-medium uppercase tracking-widest mb-4">
                  Create
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                  See the Action
                </h3>
                <p className="text-white/50 leading-relaxed">
                  Don&apos;t just imagine it—see it. Generate stunning images of
                  your characters and scenarios directly within the chat.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
