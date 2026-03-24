"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";

const METRICS = [
  { label: "Orders Delivered", value: 128430 },
  { label: "Retail Partners", value: 274 },
  { label: "Product SKUs", value: 9231 },
  { label: "Revenue Growth", value: 186, suffix: "%" },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inViewRef = useRef(null);
  const isInView = useInView(inViewRef, { once: true, amount: 0.3 });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 32, stiffness: 120 });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(
    () =>
      spring.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = Math.round(latest).toLocaleString();
        }
      }),
    [spring]
  );

  return (
    <div ref={inViewRef}>
      <span
        ref={ref}
        className="tabular-nums text-3xl md:text-4xl font-semibold"
      >
        0
      </span>
      {suffix && (
        <span className="ml-1 text-lg md:text-2xl text-slate-300/90">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function PerformanceSection() {
  return (
    <section className="relative bg-[radial-gradient(circle_at_top,_#191f2c,_transparent_55%)] from-[#0f1115] to-[#0b0d10] py-24 md:py-32 px-6 md:px-10">
      <div className="relative max-w-5xl mx-auto glass-panel px-7 py-10 md:px-10 md:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(79,140,255,0.18),transparent_60%)] opacity-80 pointer-events-none" />
        <div className="relative z-10 space-y-10">
          <div className="space-y-3">
            <p className="text-[0.7rem] tracking-[0.24em] uppercase text-slate-200/85">
              PERFORMANCE SURFACE
            </p>
            <h3 className="gradient-heading text-2xl md:text-3xl">
              Quietly confident at scale.
            </h3>
            <p className="text-sm md:text-base text-slate-300/85 max-w-2xl leading-relaxed">
              No dashboards shouting for attention—just a calm layer of metrics
              that confirm everything is moving exactly as it should.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {METRICS.map((metric) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="space-y-2"
              >
                <p className="text-[0.7rem] tracking-[0.28em] uppercase text-slate-400/85">
                  {metric.label}
                </p>
                <div className="text-[#c7d2ff]">
                  <AnimatedNumber value={metric.value} suffix={metric.suffix} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

