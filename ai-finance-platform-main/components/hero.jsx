"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, ArrowRight, TrendingUp } from "lucide-react";

const HeroSection = () => {
  const imageRef = useRef(null);

  useEffect(() => {
    const imageElement = imageRef.current;
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 100) {
        imageElement?.classList.add("scrolled");
      } else {
        imageElement?.classList.remove("scrolled");
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-4 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 animate-gradient"
          style={{
            background:
              "linear-gradient(135deg, #f8faff 0%, #eef2ff 30%, #f5f3ff 60%, #ffffff 100%)",
            backgroundSize: "400% 400%",
          }}
        />
        {/* Floating orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-40 float"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full opacity-30 float"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)",
            filter: "blur(80px)",
            animationDelay: "1.5s",
          }}
        />
        <div
          className="absolute bottom-1/4 left-1/2 w-96 h-96 rounded-full opacity-25 float"
          style={{
            background: "radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)",
            filter: "blur(80px)",
            animationDelay: "0.8s",
          }}
        />
      </div>

      {/* Badge */}
      <div className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-100 bg-white/80 backdrop-blur-md shadow-sm text-sm font-medium text-indigo-700">
        <Sparkles size={14} className="text-indigo-500" />
        AI-Powered Financial Intelligence
        <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs font-semibold">
          BETA
        </span>
      </div>

      {/* Headline */}
      <div className="text-center max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] pb-4">
          <span className="gradient-title">Your AI</span>
          <br />
          <span className="text-slate-800">Financial Advisor</span>
        </h1>
        <p className="mt-6 text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
          Smartly manage your expenses, track bills, and plan savings with 
          the intelligence of SAMPAT. Get personalized insights that matter.
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
        <Link href="/dashboard">
          <Button
            size="lg"
            className="px-8 h-14 text-base font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl shadow-xl shadow-indigo-500/30 hover:scale-[1.03] transition-all duration-200 flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight size={18} />
          </Button>
        </Link>
        <Link href="#features">
          <Button
            size="lg"
            variant="outline"
            className="px-8 h-14 text-base font-semibold border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 rounded-2xl transition-all duration-200"
          >
            See How It Works
          </Button>
        </Link>
      </div>

      {/* Social proof */}
      <div className="mt-8 flex items-center gap-2 text-sm text-slate-500">
        <TrendingUp size={14} className="text-emerald-500" />
        <span>Join thousands of users managing smarter finances</span>
      </div>

      {/* Dashboard Preview */}
      <div className="hero-image-wrapper mt-16 w-full max-w-5xl mx-auto">
        <div ref={imageRef} className="hero-image">
          <Image
            src="/hero-banner.jpg"
            width={1280}
            height={720}
            alt="SAMPAT AI Financial Advisor"
            className="rounded-2xl shadow-[0_40px_100px_rgba(99,102,241,0.2)] border border-white/60 mx-auto"
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
