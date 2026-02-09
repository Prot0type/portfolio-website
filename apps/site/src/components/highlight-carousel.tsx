"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  FocusEvent as ReactFocusEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent
} from "react";

import { CATEGORY_CLASS, projectPrimaryTag } from "@/lib/project-utils";
import type { ProjectRecord } from "@/lib/types";

type HighlightCarouselProps = {
  projects: ProjectRecord[];
};

const AUTO_SCROLL_PX_PER_SECOND = 30;
const DRAG_CLICK_THRESHOLD = 8;

export function HighlightCarousel({ projects }: HighlightCarouselProps) {
  const source = projects;
  const hasProjects = source.length > 0;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const firstSegmentRef = useRef<HTMLDivElement | null>(null);
  const secondSegmentRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const segmentWidthRef = useRef(0);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const hoveringRef = useRef(false);
  const inViewportRef = useRef(true);
  const dragPointerIdRef = useRef<number | null>(null);
  const lastPointerXRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const suppressClickRef = useRef(false);
  const suppressResetTimerRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const normalizeOffset = useCallback((value: number, width: number): number => {
    if (width <= 0) {
      return 0;
    }
    let normalized = value;
    while (normalized <= -width) {
      normalized += width;
    }
    while (normalized > 0) {
      normalized -= width;
    }
    return normalized;
  }, []);

  const applyOffset = useCallback((nextOffset: number) => {
    offsetRef.current = nextOffset;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${nextOffset}px, 0, 0)`;
    }
  }, []);

  const handleCardClick = useCallback((event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, []);

  useEffect(() => {
    if (!hasProjects) {
      return;
    }
    const firstSegmentNode = firstSegmentRef.current;
    const secondSegmentNode = secondSegmentRef.current;
    if (!firstSegmentNode || !secondSegmentNode) {
      return;
    }

    const syncToWidth = () => {
      // Loop length is the distance between the start of segment A and segment B.
      const measuredDistance = secondSegmentNode.offsetLeft - firstSegmentNode.offsetLeft;
      const nextWidth = measuredDistance > 0 ? measuredDistance : firstSegmentNode.getBoundingClientRect().width;
      if (nextWidth <= 0) {
        return;
      }
      segmentWidthRef.current = nextWidth;
      const normalized = normalizeOffset(offsetRef.current, nextWidth);
      applyOffset(normalized);
    };

    syncToWidth();

    const observer = new ResizeObserver(syncToWidth);
    observer.observe(firstSegmentNode);
    observer.observe(secondSegmentNode);

    return () => {
      observer.disconnect();
    };
  }, [applyOffset, hasProjects, normalizeOffset, source.length]);

  useEffect(() => {
    if (!hasProjects) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      return;
    }
    const shellNode = shellRef.current;
    if (!shellNode) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        inViewportRef.current = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.1 }
    );
    observer.observe(shellNode);
    return () => observer.disconnect();
  }, [hasProjects]);

  useEffect(() => {
    if (!hasProjects) {
      return;
    }
    const animate = (timestamp: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = timestamp;
      }
      const elapsedSeconds = (timestamp - (lastFrameTimeRef.current ?? timestamp)) / 1000;
      lastFrameTimeRef.current = timestamp;

      const width = segmentWidthRef.current;
      if (width > 0 && !draggingRef.current && !hoveringRef.current && inViewportRef.current && !document.hidden) {
        const next = offsetRef.current - AUTO_SCROLL_PX_PER_SECOND * elapsedSeconds;
        applyOffset(normalizeOffset(next, width));
      }

      rafRef.current = window.requestAnimationFrame(animate);
    };

    rafRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      if (suppressResetTimerRef.current !== null) {
        window.clearTimeout(suppressResetTimerRef.current);
      }
    };
  }, [applyOffset, hasProjects, normalizeOffset]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasProjects || segmentWidthRef.current <= 0) {
      return;
    }
    event.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
    dragPointerIdRef.current = event.pointerId;
    lastPointerXRef.current = event.clientX;
    dragDistanceRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || dragPointerIdRef.current !== event.pointerId) {
      return;
    }
    const deltaX = event.clientX - lastPointerXRef.current;
    lastPointerXRef.current = event.clientX;
    dragDistanceRef.current += Math.abs(deltaX);
    const next = offsetRef.current + deltaX;
    applyOffset(normalizeOffset(next, segmentWidthRef.current));
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || dragPointerIdRef.current !== event.pointerId) {
      return;
    }
    draggingRef.current = false;
    setIsDragging(false);
    dragPointerIdRef.current = null;
    if (dragDistanceRef.current > DRAG_CLICK_THRESHOLD) {
      suppressClickRef.current = true;
      if (suppressResetTimerRef.current !== null) {
        window.clearTimeout(suppressResetTimerRef.current);
      }
      suppressResetTimerRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
  };

  const pauseAutoScroll = () => {
    hoveringRef.current = true;
  };

  const resumeAutoScroll = () => {
    hoveringRef.current = false;
    lastFrameTimeRef.current = null;
  };

  const handleBlurCapture = (event: ReactFocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (!event.currentTarget.contains(nextTarget)) {
      resumeAutoScroll();
    }
  };

  if (!hasProjects) {
    return (
      <section className="highlight-section highlight-section-full-bleed">
        <div className="carousel-header-row">
          <Link href="/projects" className="carousel-projects-cta" aria-label="View all projects" title="View all projects">
            <p className="carousel-title">all projects</p>
            <span className="carousel-projects-link" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/square-arrow-up-right-solid-full.svg" alt="" />
            </span>
            <span className="sr-only">view all</span>
          </Link>
        </div>
        <p className="empty-note carousel-empty-note">No projects available yet.</p>
      </section>
    );
  }

  return (
    <section className="highlight-section highlight-section-full-bleed">
      <div className="carousel-header-row">
        <Link href="/projects" className="carousel-projects-cta" aria-label="View all projects" title="View all projects">
          <p className="carousel-title">all projects</p>
          <span className="carousel-projects-link" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/square-arrow-up-right-solid-full.svg" alt="" />
          </span>
          <span className="sr-only">view all</span>
        </Link>
      </div>
      <div
        ref={shellRef}
        className={`marquee-shell ${isDragging ? "is-dragging" : ""}`}
        onMouseEnter={pauseAutoScroll}
        onMouseLeave={resumeAutoScroll}
        onFocusCapture={pauseAutoScroll}
        onBlurCapture={handleBlurCapture}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div ref={trackRef} className="marquee-track">
          <div ref={firstSegmentRef} className="marquee-segment">
            {source.map((project) => (
              <Link
                key={`${project.project_id}-segment-a`}
                href={`/projects/${project.project_id}`}
                className="highlight-card"
                onClick={handleCardClick}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.images[0]?.url ?? "/images/project-1.svg"}
                  alt={project.images[0]?.alt || `${project.title} thumbnail`}
                  loading="lazy"
                  decoding="async"
                />
                <div className="highlight-meta">
                  <p className="highlight-title">{project.title}</p>
                  <p className={`highlight-category ${CATEGORY_CLASS[project.category]}`}>{project.category}</p>
                  <p className="highlight-tag">{projectPrimaryTag(project)}</p>
                </div>
              </Link>
            ))}
          </div>
          <div ref={secondSegmentRef} className="marquee-segment">
            {source.map((project) => (
              <Link
                key={`${project.project_id}-segment-b`}
                href={`/projects/${project.project_id}`}
                className="highlight-card"
                onClick={handleCardClick}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.images[0]?.url ?? "/images/project-1.svg"}
                  alt={project.images[0]?.alt || `${project.title} thumbnail`}
                  loading="lazy"
                  decoding="async"
                />
                <div className="highlight-meta">
                  <p className="highlight-title">{project.title}</p>
                  <p className={`highlight-category ${CATEGORY_CLASS[project.category]}`}>{project.category}</p>
                  <p className="highlight-tag">{projectPrimaryTag(project)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
