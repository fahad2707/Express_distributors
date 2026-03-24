"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    title: "Fast Fulfillment",
    body: "Orders glide from confirmation to dock with orchestrated precision—engineered SLAs that feel effortless to your customers.",
  },
  {
    title: "Real-time Inventory Sync",
    body: "A single calm source of truth, streaming inventory signals from warehouse to storefront without noisy discrepancies.",
  },
  {
    title: "Multi-Vendor Support",
    body: "Unify complex vendor networks into one serene surface—clean pricing, clean terms, clean performance.",
  },
  {
    title: "Smart Shipping Integration",
    body: "Carrier intelligence that quietly optimizes every route for cost, speed and temperature control.",
  },
  {
    title: "Insightful Analytics",
    body: "Executive-level clarity on velocity, margin and fill rate—no dashboards that shout, only ones that guide.",
  },
];

export function FeatureHighlightsSection() {
  return (
    <section className="relative bg-gradient-to-b from-[#0c0f15] via-[#0f1115] to-[#10141e] py-24 md:py-32 px-6 md:px-10">
      <div className="relative max-w-6xl mx-auto space-y-16 md:space-y-20">
        {FEATURES.map((feature, index) => {
          const isEven = index % 2 === 0;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className={`flex flex-col gap-10 md:gap-14 ${
                isEven ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              <div className="flex-1 space-y-4 md:space-y-6">
                <p className="text-[0.7rem] tracking-[0.32em] uppercase text-slate-400/80">
                  FEATURE
                </p>
                <h3 className="gradient-heading text-xl md:text-2xl font-semibold tracking-[0.16em]">
                  {feature.title}
                </h3>
                <p className="text-sm md:text-base text-slate-300/85 leading-relaxed">
                  {feature.body}
                </p>
              </div>

              <div className="flex-1">
                <div className="glass-panel relative px-6 py-8 md:px-8 md:py-10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,92,255,0.2),transparent_65%)] opacity-70 pointer-events-none" />
                  <div className="relative flex items-center justify-between gap-6">
                    <div className="space-y-3">
                      <p className="text-[0.78rem] text-slate-200/90 tracking-[0.24em] uppercase">
                        Flow Snapshot
                      </p>
                      <p className="text-sm text-slate-300/85 max-w-xs leading-relaxed">
                        A composable, API-first layer that lets your teams connect
                        tooling without disturbing the calm of operations.
                      </p>
                    </div>
                    <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-3xl bg-gradient-to-br from-[#7c5cff55] via-[#4f8cff44] to-[#161a25] border border-white/14 shadow-[0_24px_70px_rgba(0,0,0,0.9)] overflow-hidden">
                      <div className="absolute inset-0 bg-[conic-gradient(from_220deg,_rgba(255,255,255,0.4),transparent_45%,transparent_75%,rgba(255,255,255,0.22))] opacity-70" />
                      <div className="absolute inset-3 rounded-2xl bg-black/45 border border-white/12 flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full border border-white/30 border-dashed animate-[spin_24s_linear_infinite]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

