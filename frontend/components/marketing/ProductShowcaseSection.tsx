"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface MarketingProduct {
  id: string;
  name: string;
  category_name?: string;
  image_url?: string;
}

export function ProductShowcaseSection() {
  const [products, setProducts] = useState<MarketingProduct[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/products?limit=6");
        const fromApi: MarketingProduct[] = (res.data?.products || []).map((p: any) => ({
          id: String(p.id ?? p._id ?? ""),
          name: p.name,
          category_name: p.category_name,
          image_url: p.image_url,
        }));
        if (mounted && fromApi.length) {
          setProducts(fromApi);
        } else if (mounted) {
          setProducts([
            { id: "1", name: "Midnight Cold Brew", category_name: "Beverages" },
            { id: "2", name: "Slow Baked Granola", category_name: "Snacks" },
            { id: "3", name: "Everyday Essentials Pack", category_name: "Grocery" },
            { id: "4", name: "Calm Care Handwash", category_name: "Personal Care" },
            { id: "5", name: "Quiet Clean Wipes", category_name: "Household" },
            { id: "6", name: "Ambient Sparkling Water", category_name: "Beverages" },
          ]);
        }
      } catch {
        if (mounted) {
          setProducts([
            { id: "1", name: "Midnight Cold Brew", category_name: "Beverages" },
            { id: "2", name: "Slow Baked Granola", category_name: "Snacks" },
            { id: "3", name: "Everyday Essentials Pack", category_name: "Grocery" },
            { id: "4", name: "Calm Care Handwash", category_name: "Personal Care" },
            { id: "5", name: "Quiet Clean Wipes", category_name: "Household" },
            { id: "6", name: "Ambient Sparkling Water", category_name: "Beverages" },
          ]);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <section className="relative bg-[#0f1115] py-24 md:py-32 px-6 md:px-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#181c27,_transparent_55%)] opacity-80 pointer-events-none" />
      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-slate-400/80">
              PRODUCT SYSTEM
            </p>
            <h3 className="mt-3 gradient-heading text-2xl md:text-3xl font-semibold tracking-[0.12em]">
              A calm grid for complex assortments.
            </h3>
            <p className="mt-4 max-w-xl text-sm md:text-base text-slate-300/85 leading-relaxed">
              As you scroll, dense category stacks resolve into a precise, legible
              grid—making thousands of SKUs feel intuitive in a single glance.
            </p>
          </div>
          <p className="text-xs md:text-sm text-slate-400/80 max-w-sm md:text-right">
            Hover to explore depth: each card gently lifts, edges glow and
            artwork glides forward—subtle cues of a high-performance catalog.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.08 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {products.map((product) => (
            <motion.article
              key={product.id}
              variants={{
                hidden: { opacity: 0, y: 32, filter: "blur(8px)" },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { duration: 0.8, ease: "easeOut" },
                },
              }}
              className="group relative glass-panel p-5 md:p-6 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/4 via-transparent to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[0.65rem] uppercase tracking-[0.24em] text-slate-200/90">
                    {product.category_name || "Assortment"}
                  </span>
                  <span className="text-[0.7rem] text-slate-300/85">Featured</span>
                </div>
                <h4 className="text-base md:text-lg text-slate-50/95 tracking-[0.08em] mb-2">
                  {product.name}
                </h4>
                <p className="text-[0.78rem] md:text-sm text-slate-300/80 leading-relaxed mb-4">
                  Precision-picked SKUs with predictable turn, margin and
                  replenishment—curated for modern retail footprints.
                </p>
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/8">
                  <span className="text-[0.7rem] text-slate-400/80 tracking-[0.22em] uppercase">
                    View Assortment
                  </span>
                  <div className="relative h-9 w-9 overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-[#7c5cff44] to-[#4f8cff33] shadow-[0_0_18px_rgba(15,17,21,0.9)] transition-transform duration-300 ease-out group-hover:scale-105">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.7),transparent_55%)] opacity-70" />
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 ring-1 ring-transparent group-hover:ring-[#7c5cff88] transition duration-300 ease-out pointer-events-none" />
              <div className="absolute inset-0 translate-y-4 scale-105 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out">
                {/* Image zoom placeholder - connect to real artwork later */}
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

