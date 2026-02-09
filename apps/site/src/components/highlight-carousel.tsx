"use client";

import Link from "next/link";

import { CATEGORY_CLASS, projectPrimaryTag } from "@/lib/project-utils";
import type { ProjectRecord } from "@/lib/types";

type HighlightCarouselProps = {
  projects: ProjectRecord[];
};

export function HighlightCarousel({ projects }: HighlightCarouselProps) {
  const highlighted = projects.filter((project) => project.is_highlighted);
  const source = highlighted.length > 0 ? highlighted : projects;
  const trackProjects = [...source, ...source];

  if (source.length === 0) {
    return <p className="empty-note">No highlighted projects available yet.</p>;
  }

  return (
    <section className="highlight-section">
      <div className="section-heading">
        <p>Highlighted Projects</p>
      </div>
      <div className="marquee-shell">
        <div className="marquee-track">
          {trackProjects.map((project, index) => (
            <Link key={`${project.project_id}-${index}`} href={`/projects/${project.project_id}`} className="highlight-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.images[0]?.url ?? "/images/project-1.svg"}
                alt={project.images[0]?.alt || `${project.title} thumbnail`}
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
      <p className="section-note">Carousel auto-scrolls left and pauses on hover.</p>
    </section>
  );
}

