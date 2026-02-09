"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

import { HighlightCarousel } from "@/components/highlight-carousel";
import { SocialIconRow } from "@/components/social-icon-row";
import { getPublishedProjects, recordWebsiteView } from "@/lib/api";
import type { ProjectRecord } from "@/lib/types";

const FRAME_CORNER_SIZE = 64;

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewport, setViewport] = useState({ width: 1280, height: 900 });
  const [outroInteractive, setOutroInteractive] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start start", "end end"]
  });

  const openProgress = useTransform(scrollYProgress, [0, 0.34], [0, 1], { clamp: true });
  const closeProgress = useTransform(scrollYProgress, [0.74, 0.99], [0, 1], { clamp: true });
  const openSpread = useTransform(openProgress, [0.14, 1], [0, 1], { clamp: true });
  const closeGather = useTransform(closeProgress, [0.08, 1], [0, 1], { clamp: true });
  const frameSpreadRaw = useTransform([openSpread, closeGather], (latest) => {
    const [openValue, closeValue] = latest as number[];
    return Math.max(0, openValue - closeValue);
  });
  const frameSpread = useSpring(frameSpreadRaw, { stiffness: 110, damping: 30, mass: 0.6 });

  const introNameOpacity = useTransform(openProgress, [0, 0.84], [1, 0], { clamp: true });
  const outroNameOpacity = useTransform(closeProgress, [0.42, 1], [0, 1], { clamp: true });
  const contentOpacity = useTransform(openProgress, [0.78, 0.98], [0, 1], { clamp: true });
  const contentY = useTransform(openProgress, [0.78, 0.98], [96, 0], { clamp: true });
  const profileOpacity = useTransform(openProgress, [0.82, 0.98], [0, 1], { clamp: true });
  const profileY = useTransform(openProgress, [0.82, 0.98], [26, 0], { clamp: true });

  const halfBoxWidth = Math.min(280, viewport.width * 0.22);
  const halfBoxHeight = Math.min(170, viewport.height * 0.22);
  const fullFrameWidth = halfBoxWidth * 2;
  const fullFrameHeight = halfBoxHeight * 2;
  const frameMargin = Math.max(20, Math.min(36, viewport.width * 0.03));
  const cornerMorph = useTransform(frameSpread, [0, 0.16], [0, 1], { clamp: true });
  const pieceWidth = useTransform(cornerMorph, (progress) => lerp(fullFrameWidth, FRAME_CORNER_SIZE, progress));
  const pieceHeight = useTransform(cornerMorph, (progress) => lerp(fullFrameHeight, FRAME_CORNER_SIZE, progress));

  const topRightAnchorX = useTransform(frameSpread, (progress) => {
    const startX = viewport.width / 2 + halfBoxWidth;
    const endX = viewport.width - frameMargin;
    return lerp(startX, endX, progress);
  });
  const topRightAnchorY = useTransform(frameSpread, (progress) => {
    const startY = viewport.height / 2 - halfBoxHeight;
    const endY = frameMargin;
    return lerp(startY, endY, progress);
  });
  const topRightLeft = useTransform([topRightAnchorX, pieceWidth], (latest) => {
    const [anchorX, width] = latest as number[];
    return anchorX - width;
  });
  const topRightTop = topRightAnchorY;

  const bottomLeftAnchorX = useTransform(frameSpread, (progress) => {
    const startX = viewport.width / 2 - halfBoxWidth;
    const endX = frameMargin;
    return lerp(startX, endX, progress);
  });
  const bottomLeftAnchorY = useTransform(frameSpread, (progress) => {
    const startY = viewport.height / 2 + halfBoxHeight;
    const endY = viewport.height - frameMargin;
    return lerp(startY, endY, progress);
  });
  const bottomLeftLeft = bottomLeftAnchorX;
  const bottomLeftTop = useTransform([bottomLeftAnchorY, pieceHeight], (latest) => {
    const [anchorY, height] = latest as number[];
    return anchorY - height;
  });

  useEffect(() => {
    getPublishedProjects()
      .then((records) => setProjects(records))
      .finally(() => setLoading(false));
    recordWebsiteView("/").catch(() => undefined);
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useMotionValueEvent(closeProgress, "change", (latest) => {
    setOutroInteractive((current) => {
      const next = latest > 0.54;
      return current === next ? current : next;
    });
  });

  return (
    <main ref={rootRef} className="home-scroll-page">
      {!reduceMotion ? (
        <>
          <div className="frame-layer" aria-hidden>
            <motion.h1 className="landing-name" style={{ opacity: introNameOpacity }}>
              <span>ishani</span>
              <span>churi</span>
            </motion.h1>

            <motion.div
              className="frame-piece frame-piece-top-right"
              style={{
                left: topRightLeft,
                top: topRightTop,
                width: pieceWidth,
                height: pieceHeight
              }}
            >
              <div className="frame-piece-h" />
              <div className="frame-piece-v" />
            </motion.div>
            <motion.div
              className="frame-piece frame-piece-bottom-left"
              style={{
                left: bottomLeftLeft,
                top: bottomLeftTop,
                width: pieceWidth,
                height: pieceHeight
              }}
            >
              <div className="frame-piece-h" />
              <div className="frame-piece-v" />
            </motion.div>
          </div>

          <motion.div
            className="outro-overlay"
            style={{
              opacity: outroNameOpacity,
              pointerEvents: outroInteractive ? "auto" : "none"
            }}
          >
            <h2 className="script-heading outro-script">thank you</h2>
            <SocialIconRow />
          </motion.div>
        </>
      ) : null}

      <section className="home-scroll-intro" />

      <motion.section
        className="home-content-shell"
        style={
          reduceMotion
            ? undefined
            : {
                opacity: contentOpacity,
                y: contentY
              }
        }
      >
        <motion.section
          className="home-profile-block"
          aria-label="Ishani profile"
          style={reduceMotion ? undefined : { opacity: profileOpacity, y: profileY }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="home-profile-photo"
            src="/images/ishani-portrait-placeholder.jpg"
            alt="Portrait placeholder of Ishani Churi"
            loading="lazy"
            decoding="async"
          />
          <div className="home-profile-bio">
            <p>IITH graduate with 3+ years of experience and a passion to create.</p>
            <p>Mi khoop katkat karte.</p>
          </div>
        </motion.section>
        {loading ? <p className="empty-note">Loading projects...</p> : <HighlightCarousel projects={projects} />}
      </motion.section>

      <section className="home-scroll-end" />
    </main>
  );
}
