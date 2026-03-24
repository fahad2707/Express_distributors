"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TESTIMONIALS = [
  {
    name: "Amrita Desai",
    role: "Head of Modern Trade, Coastal Foods",
    quote:
      "Express Distributors turned our weekly firefighting into a quiet background process. Our teams now obsess over brand, not stock-outs.",
  },
  {
    name: "Rohit Sharma",
    role: "Founder, Nova Beverage Co.",
    quote:
      "They feel less like a distributor and more like a systems partner. Every launch landed with the kind of calm you feel on a showroom floor.",
  },
  {
    name: "Sarah Lin",
    role: "VP Operations, Cornerstone Retail",
    quote:
      "Their visibility layer is the first I have seen that executives actually enjoy looking at. It reads like a story instead of a spreadsheet.",
  },
];

export function TestimonialsSection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((prev) => (prev + 1) % TESTIMONIALS.length),
      9000
    );
    return () => clearInterval(id);
  }, []);

  const active = TESTIMONIALS[index];

  return (
    <section className="relative bg-[#0f1115] py-24 md:py-32 px-6 md:px-10">
      <div className="relative max-w-4xl mx-auto text-center space-y-10">
        <div className="space-y-3">
          <p className="text-[0.7rem] tracking-[0.32em] uppercase text-slate-400/85">
            TRUSTED PERSPECTIVES
          </p>
          <h3 className="gradient-heading text-2xl md:text-3xl font-semibold tracking-[0.16em]">
            The calm behind retail stories you already know.
          </h3>
        </div>

        <div className="relative">
          <div className="mx-auto max-w-3xl glass-panel px-7 py-10 md:px-10 md:py-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.name}
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -18, filter: "blur(6px)" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="space-y-5"
              >
                <p className="text-sm md:text-base text-slate-200/90 leading-relaxed">
                  “{active.quote}”
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-50/95">
                    {active.name}
                  </p>
                  <p className="text-xs md:text-[0.78rem] text-slate-400/85">
                    {active.role}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex justify-center gap-2">
              {TESTIMONIALS.map((t, i) => {
                const activeDot = i === index;
                return (
                  <button
                    key={t.name}
                    onClick={() => setIndex(i)}
                    className="relative h-2.5 w-6 rounded-full bg-white/10 overflow-hidden"
                  >
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#7c5cff] to-[#4f8cff] transition-all duration-400 ${
                        activeDot ? "w-full opacity-100" : "w-0 opacity-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

