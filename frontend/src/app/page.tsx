"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import HeroScene from "@/components/3d/HeroScene";
import { ArrowRight, Bot, Zap, Shield, Database } from "lucide-react";

export default function LandingPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <main className="relative min-h-screen" ref={containerRef}>
      {/* 3D Background */}
      <motion.div style={{ y, opacity }} className="fixed inset-0 z-0 h-screen w-full">
        <HeroScene />
      </motion.div>

      {/* Hero Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neonBlue/30 bg-neonBlue/10 px-4 py-1.5 text-sm font-medium text-neonBlue backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neonBlue opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-neonBlue"></span>
            </span>
            Aura Engine v2.0 Live
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl">
            Intent-Aware <br />
            <span className="text-gradient">Agentic System</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 md:text-xl">
            A next-generation conversational AI featuring RAG integration, dynamic intent routing, and intelligent lead management.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/chat">
              <button className="group relative overflow-hidden rounded-full bg-white px-8 py-4 font-semibold text-black transition-transform hover:scale-105 active:scale-95">
                <span className="relative z-10 flex items-center gap-2">
                  Launch Assistant <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-neonBlue to-neonPurple opacity-0 transition-opacity group-hover:opacity-100"></div>
              </button>
            </Link>
            <button className="rounded-full border border-white/20 bg-white/5 px-8 py-4 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10">
              View Architecture
            </button>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 bg-darkBg/80 py-32 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold md:text-5xl">Powered by <span className="text-neonPurple">LangGraph</span></h2>
            <p className="mt-4 text-gray-400">Modular, scalable state-machine architecture for complex reasoning.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Bot, title: "Intent Routing", desc: "Dynamically routes conversations based on multi-turn context." },
              { icon: Database, title: "Local RAG", desc: "FAISS and sentence-transformers ensure zero hallucinations." },
              { icon: Shield, title: "Safe Tool Execution", desc: "Strictly gated tool calls for database modifications." },
              { icon: Zap, title: "High Performance", desc: "Built on FastAPI and Next.js App Router." },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-panel group rounded-2xl p-6 transition-all hover:-translate-y-2 hover:border-neonBlue/50"
              >
                <div className="mb-4 inline-flex rounded-lg bg-neonBlue/10 p-3 text-neonBlue transition-colors group-hover:bg-neonBlue group-hover:text-black">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
