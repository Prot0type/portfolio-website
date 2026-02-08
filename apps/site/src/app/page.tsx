"use client";

import { useEffect, useState } from "react";

import { Hero } from "@/components/hero";
import { ProjectCarousel } from "@/components/project-carousel";
import { SocialLinks } from "@/components/social-links";
import { getPublishedProjects, recordWebsiteView } from "@/lib/api";
import type { ProjectRecord } from "@/lib/types";

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublishedProjects()
      .then((records) => setProjects(records))
      .finally(() => setLoading(false));
    recordWebsiteView().catch(() => undefined);
  }, []);

  return (
    <main className="site-shell">
      <div className="ambient-gradient" aria-hidden />
      <Hero projectCount={projects.length} />
      {loading ? (
        <section className="loading-block">
          <p>Loading projects...</p>
        </section>
      ) : (
        <ProjectCarousel projects={projects} />
      )}
      <SocialLinks />
    </main>
  );
}

