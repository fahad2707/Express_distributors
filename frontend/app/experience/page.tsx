"use client";

import { SmoothScrollProvider } from "@/components/marketing/SmoothScrollProvider";
import { HeroSection } from "@/components/marketing/HeroSection";
import { BrandStatementSection } from "@/components/marketing/BrandStatementSection";
import { CategoryStorySection } from "@/components/marketing/CategoryStorySection";
import { ProductShowcaseSection } from "@/components/marketing/ProductShowcaseSection";
import { FeatureHighlightsSection } from "@/components/marketing/FeatureHighlightsSection";
import { PerformanceSection } from "@/components/marketing/PerformanceSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { CTASection } from "@/components/marketing/CTASection";
import { FooterSection } from "@/components/marketing/FooterSection";

export default function ExperiencePage() {
  return (
    <SmoothScrollProvider>
      <main className="min-h-screen bg-[#0f1115] text-slate-50">
        <HeroSection />
        <BrandStatementSection />
        <CategoryStorySection />
        <ProductShowcaseSection />
        <FeatureHighlightsSection />
        <PerformanceSection />
        <TestimonialsSection />
        <CTASection />
        <FooterSection />
      </main>
    </SmoothScrollProvider>
  );
}

