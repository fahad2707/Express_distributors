"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const orbRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (orbRef.current) {
        gsap.to(orbRef.current, {
          x: 60,
          y: -40,
          duration: 10,
          repeat: -1,
          yoyo: true,
          ease: "power3.inOut",
        });
      }
      if (particlesRef.current) {
        const dots = particlesRef.current.querySelectorAll(".hero-dot");
        gsap.to(dots, {
          y: -20,
          opacity: 0.7,
          stagger: { each: 0.12, repeat: -1, yoyo: true },
          duration: 4,
          ease: "power3.inOut",
        });
      }
    });
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0f1115]"
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          ref={orbRef}
          className="absolute -top-40 -left-24 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_top,_#7c5cff55,_transparent_60%)] blur-3xl opacity-70"
        />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_bottom,_#4f8cff44,_transparent_65%)] blur-3xl opacity-60" />
        <div
          ref={particlesRef}
          className="absolute inset-0"
        >
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="hero-dot absolute h-[3px] w-[3px] rounded-full bg-white/40"
              style={{
                top: `${10 + (i * 5.3) % 80}%`,
                left: `${8 + (i * 11.1) % 90}%`,
                opacity: 0.2 + (i % 5) * 0.08,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-5xl px-6 py-24 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center text-center space-y-8"
        >
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="text-sm md:text-base tracking-[0.35em] uppercase text-slate-300/80"
          >
            EXPRESS DISTRIBUTORS
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.9, ease: "easeOut" }}
            className="gradient-heading text-4xl sm:text-5xl md:text-6xl lg:text-[3.6rem] leading-tight"
          >
            Elevating Modern Distribution
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.9, ease: "easeOut" }}
            className="max-w-2xl text-base md:text-lg text-slate-300/80 leading-relaxed"
          >
            A premium supply experience for ambitious brands and retailers—where
            every pallet, package and product moves with cinematic precision.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.9, ease: "easeOut" }}
            className="mt-6 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              className="glass-button glass-button-gradient relative px-7 py-3 text-sm md:text-base font-medium text-white tracking-[0.18em] uppercase flex items-center justify-center gap-2 transition-transform duration-300 ease-out hover:scale-[1.03]"
            >
              <span>Explore Products</span>
            </button>
            <button
              className="glass-button relative px-7 py-3 text-sm md:text-base font-medium text-slate-100 tracking-[0.18em] uppercase flex items-center justify-center gap-2 bg-white/3 hover:bg-white/8 transition-transform duration-300 ease-out hover:scale-[1.03]"
            >
              <span>Contact Us</span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ delay: 1, duration: 0.9, ease: "easeOut" }}
            className="mt-10 glass-panel max-w-xl w-full px-6 py-4 flex items-center justify-between text-xs md:text-sm text-slate-200/80"
          >
            <span className="tracking-[0.28em] uppercase text-slate-300/80">
              NEXT-GEN WHOLESALE
            </span>
            <span className="text-slate-200/80">
              Designed for calm control at scale.
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

