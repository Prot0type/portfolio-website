"use client";

import { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { ProjectRecord } from "@/lib/types";

type ProjectCarouselProps = {
  projects: ProjectRecord[];
};

type ZoomState = {
  url: string;
  alt: string;
} | null;

export function ProjectCarousel({ projects }: ProjectCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false });
  const [zoom, setZoom] = useState<ZoomState>(null);
  const reduceMotion = useReducedMotion();

  return (
    <section className="projects" id="projects">
      <div className="section-header">
        <p className="eyebrow">Selected Work</p>
        <h2>Projects</h2>
      </div>

      <div className="carousel-controls">
        <button type="button" onClick={() => emblaApi?.scrollPrev()} aria-label="Scroll previous projects">
          Prev
        </button>
        <button type="button" onClick={() => emblaApi?.scrollNext()} aria-label="Scroll next projects">
          Next
        </button>
      </div>

      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {projects.map((project, index) => {
            const image = project.images[0] ?? {
              key: `${project.project_id}-fallback`,
              url: "/images/project-1.svg",
              alt: `${project.title} preview`
            };
            return (
              <motion.article
                key={project.project_id}
                className="embla__slide project-card"
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
              >
                <button
                  type="button"
                  className="image-button"
                  onClick={() => setZoom({ url: image.url, alt: image.alt || project.title })}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={image.alt || project.title} className="project-image" loading="lazy" />
                </button>
                <div className="project-card-body">
                  <p className="project-date">{project.project_date}</p>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <ul className="tags">
                    {project.tags.map((tag) => (
                      <li key={`${project.project_id}-${tag}`}>{tag}</li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {zoom ? (
          <motion.div
            className="zoom-overlay"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(null)}
          >
            <motion.div
              className="zoom-content"
              initial={reduceMotion ? false : { scale: 0.94, opacity: 0 }}
              animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
              exit={reduceMotion ? undefined : { scale: 0.98, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button type="button" className="zoom-close" onClick={() => setZoom(null)}>
                Close
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={zoom.url} alt={zoom.alt} className="zoom-image" />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

