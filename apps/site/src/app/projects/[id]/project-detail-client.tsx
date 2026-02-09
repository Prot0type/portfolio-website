"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { getPublishedProjectById, recordWebsiteView } from "@/lib/api";
import { CATEGORY_CLASS, projectPrimaryTag } from "@/lib/project-utils";
import type { ProjectRecord } from "@/lib/types";

type ProjectDetailClientProps = {
  projectId: string;
};

type ZoomImageState = {
  url: string;
  alt: string;
} | null;

export function ProjectDetailClient({ projectId }: ProjectDetailClientProps) {
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomImage, setZoomImage] = useState<ZoomImageState>(null);

  useEffect(() => {
    getPublishedProjectById(projectId)
      .then((data) => setProject(data))
      .finally(() => setLoading(false));
    recordWebsiteView(`/projects/${projectId}`).catch(() => undefined);
  }, [projectId]);

  if (loading) {
    return (
      <main className="page-shell">
        <p className="empty-note">Loading project...</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="page-shell">
        <p className="empty-note">Project not found.</p>
        <Link href="/projects" className="inline-link">
          Back to projects
        </Link>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <Link href="/projects" className="inline-link">
        ← Back to projects
      </Link>

      <header className="project-detail-header">
        <p className="kicker">{project.project_date}</p>
        <h1>{project.title}</h1>
        <p>{project.description}</p>
        <p className={`project-category ${CATEGORY_CLASS[project.category]}`}>
          {project.category} · Primary tag: {projectPrimaryTag(project)}
        </p>
      </header>

      <section className="project-image-grid">
        {project.images.map((image) => (
          <button
            type="button"
            key={image.key}
            className="project-image-button"
            onClick={() => setZoomImage({ url: image.url, alt: image.alt || project.title })}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.alt || project.title} />
          </button>
        ))}
      </section>

      <section className="detail-tag-wrap">
        {project.tags.map((tag, index) => (
          <span key={tag} className={`detail-tag ${index === 0 ? "primary" : ""}`}>
            {index === 0 ? `Primary · ${tag}` : tag}
          </span>
        ))}
      </section>

      <AnimatePresence>
        {zoomImage ? (
          <motion.button
            type="button"
            className="zoom-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
          >
            <motion.div
              className="zoom-content"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={zoomImage.url} alt={zoomImage.alt} className="zoom-image" />
            </motion.div>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

