"use client";

import { motion, useReducedMotion } from "framer-motion";

type HeroProps = {
  projectCount: number;
};

export function Hero({ projectCount }: HeroProps) {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" };

  return (
    <section className="hero">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={transition}>
        <p className="eyebrow">Portfolio</p>
        <h1 className="hero-title">
          Building high-impact digital products with <span>balanced motion</span>.
        </h1>
        <p className="hero-subtitle">
          I design and engineer clean experiences that feel alive without overloading low-power devices.
        </p>
        <div className="hero-meta">
          <span>{projectCount} showcased projects</span>
          <span>Optimized for mobile and desktop</span>
        </div>
      </motion.div>

      <motion.div
        className="hero-card"
        drag={!reduceMotion}
        dragElastic={0.08}
        whileTap={{ cursor: "grabbing" }}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...transition, delay: 0.12 }}
      >
        <p className="hero-card-label">Interaction Preview</p>
        <h2 className="hero-card-title">Scroll, drag, fade.</h2>
        <p className="hero-card-text">
          Motion responds to intent. Animations are staggered and measured, not constant.
        </p>
      </motion.div>
    </section>
  );
}

