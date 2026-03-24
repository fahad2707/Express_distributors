"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CATEGORIES = [
  "Beverages",
  "Snacks",
  "Grocery",
  "Personal Care",
  "Household",
];

export function CategoryStorySection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLDivElement>(".category-card");

      gsap.set(cards, {
        yPercent: 0,
        scale: 0.98,
        rotateX: -8,
        opacity: 0.85,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=200%",
          scrub: true,
          pin: true,
        },
      });

      tl.to(cards, {
        yPercent: (index) =>
          (index - (cards.length - 1) / 2) * 60,
        rotateX: 0,
        opacity: 1,
        scale: 1,
        duration: 1.4,
        ease: "power3.out",
        stagger: 0.08,
      }).to(
        cards,
        {
          yPercent: (index) =>
            (index - (cards.length - 1) / 2) * 140,
          rotateX: (index) => (index - 2) * 3.5,
          boxShadow:
            "0px 28px 80px rgba(0,0,0,0.9), 0 0 48px rgba(124,92,255,0.35)",
          duration: 1.6,
          ease: "power3.out",
          stagger: 0.06,
        },
        "+=0.2"
      );

      tl.to(
        ".category-card .category-products",
        {
          opacity: 1,
          y: 0,
          stagger: {
            each: 0.06,
            from: "random",
          },
          duration: 1.2,
          ease: "power3.out",
        },
        "-=0.6"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[160vh] bg-[#0f1115] py-6 md:py-8 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1b2132,_transparent_55%)] opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_#0c101b,_transparent_60%)] opacity-80" />

      <div className="sticky top-0 h-screen flex items-start justify-center pt-4 md:pt-6 px-4 md:px-10">
        <div className="relative max-w-5xl w-full mx-auto">
          <div className="mb-10 text-center space-y-2 relative z-10">
            <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-slate-400/80">
              CATEGORY STORY
            </p>
            <h3 className="gradient-heading text-2xl md:text-3xl font-semibold tracking-[0.12em]">
              From stacked complexity to curated clarity.
            </h3>
          </div>

          <div className="relative flex items-center justify-center">
            {CATEGORIES.map((name, index) => (
              <div
                key={name}
                className="category-card glass-panel absolute w-full max-w-md mx-auto px-6 py-6 md:px-7 md:py-7"
                style={{
                  zIndex: CATEGORIES.length - index,
                  transform: `translateY(${index * 12}px)`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[0.65rem] md:text-[0.7rem] tracking-[0.3em] uppercase text-slate-300/70">
                      Category
                    </p>
                    <p className="mt-1 text-lg md:text-xl text-slate-50/95 tracking-[0.12em]">
                      {name}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-[radial-gradient(circle_at_top,_#7c5cff77,_transparent_60%)] border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]" />
                </div>
                <p className="text-xs md:text-sm text-slate-300/80 leading-relaxed mb-4">
                  Calm, curated assortments tuned for modern shelves—each
                  category orchestrated for availability, margin and speed.
                </p>
                <div className="category-products opacity-0 translate-y-4 grid grid-cols-2 gap-2 text-[0.7rem] md:text-xs text-slate-200/90">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem]">
                    Signature SKUs
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem]">
                    Tiered pricing
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem]">
                    Cold-chain ready
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem]">
                    Regional bestsellers
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

