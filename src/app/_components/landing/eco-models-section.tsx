"use client";

import { motion } from "motion/react";
import { Link } from "@/components/ui/link";
import { ArrowRight } from "@untitledui/icons";
import { LightningIcon } from "@phosphor-icons/react/dist/ssr";

const stats = [
  { value: "1000+", label: "Daily messages" },
  { value: "$0", label: "To start" },
  { value: "24/7", label: "Available" },
  { value: "Fast", label: "Response" },
] as const;

export function EcoModelsSection() {
  return (
    <section className="relative py-24 px-8 md:px-16 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-black to-teal-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(20,184,166,0.1),transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6">
              <LightningIcon weight="fill" className="size-4" />
              Always Free
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6 leading-tight">
              Chat for free. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                Forever.
              </span>
            </h2>

            <p className="text-lg text-white/60 mb-8 leading-relaxed">
              No credit card? No problem. Jump into unmetered conversations with
              our efficient models and keep the story going as long as you want.
            </p>

            <Link
              href="/explore"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-black px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-all duration-300 group"
            >
              Start Chatting
              <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="relative p-6 rounded-2xl bg-white/5 backdrop-blur-md group hover:bg-white/10 transition-colors duration-300"
                >
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/50">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
