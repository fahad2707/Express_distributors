"use client";

import { motion } from "framer-motion";

export function CTASection() {
  return (
    <section className="relative bg-gradient-to-b from-[#0f1115] via-[#0a0c10] to-[#050609] py-24 md:py-28 px-6 md:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#20263a,_transparent_60%)] opacity-90 pointer-events-none" />
      <div className="relative max-w-3xl mx-auto glass-panel px-7 py-10 md:px-12 md:py-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="space-y-6"
        >
          <h3 className="gradient-heading text-2xl md:text-3xl font-semibold tracking-[0.16em]">
            Ready to redesign how distribution feels?
          </h3>
          <p className="text-sm md:text-base text-slate-300/85 leading-relaxed max-w-2xl mx-auto">
            Invite your team, bring your complex reality and see how a calmer,
            cinematic layer of infrastructure can sit quietly underneath it all.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button className="glass-button glass-button-gradient relative px-8 py-3 text-sm md:text-base font-medium text-white tracking-[0.2em] uppercase transition-transform duration-300 ease-out hover:scale-[1.03]">
              Schedule A Walkthrough
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

