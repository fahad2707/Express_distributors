"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STATEMENT = "Built for Scale. Designed for Precision.";

export function BrandStatementSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const chars = gsap.utils.toArray<HTMLSpanElement>(".brand-char");
      gsap.fromTo(
        chars,
        {
          opacity: 0,
          y: 24,
          filter: "blur(6px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.04,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top center",
            end: "bottom center",
            scrub: false,
            toggleActions: "play none none reverse",
          },
        }
      );

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=140%",
        pin: true,
        scrub: true,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[120vh] flex items-center justify-center bg-gradient-to-b from-[#101218] via-[#0f1115] to-[#0b0d10] px-6 md:px-10"
    >
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center space-y-8">
        <h2 className="gradient-heading text-2xl md:text-3xl text-slate-200/90">
          BRAND PHILOSOPHY
        </h2>
        <p className="mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-[2.9rem] font-extrabold tracking-[0.06em] leading-snug text-slate-50/95 uppercase">
          {Array.from(STATEMENT).map((ch, idx) => (
            <span
              key={idx}
              className="brand-char inline-block"
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </p>
        <p className="mt-6 max-w-2xl mx-auto text-sm md:text-base text-slate-300/80 leading-relaxed">
          Every interaction, from pallet to product page, is orchestrated to feel
          calm, controlled and unmistakably premium.
        </p>
      </div>
    </section>
  );
}

