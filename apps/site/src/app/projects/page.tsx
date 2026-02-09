"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getPublishedProjects, recordWebsiteView } from "@/lib/api";
import { CATEGORY_CLASS, projectPrimaryTag, uniqueProjectTags } from "@/lib/project-utils";
import type { ProjectRecord } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    getPublishedProjects()
      .then((records) => setProjects(records))
      .finally(() => setLoading(false));
    recordWebsiteView("/projects").catch(() => undefined);
  }, []);

  const allTags = useMemo(() => uniqueProjectTags(projects), [projects]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch =
        normalizedSearch.length === 0 || project.title.toLowerCase().includes(normalizedSearch);
      const matchesTags =
        selectedTags.length === 0 || selectedTags.some((tag) => project.tags.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [projects, search, selectedTags]);

  function toggleTag(tag: string) {
    setSelectedTags((previous) =>
      previous.includes(tag) ? previous.filter((item) => item !== tag) : [...previous, tag]
    );
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <p className="kicker">Projects</p>
        <h1>All project work</h1>
        <p>Search by title and filter by tags.</p>
      </header>

      <section className="filter-panel">
        <label className="search-box">
          <span>Search by title</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Type a keyword"
          />
        </label>
        <div className="tag-filter-wrap">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-filter ${selectedTags.includes(tag) ? "active" : ""}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {loading ? <p className="empty-note">Loading projects...</p> : null}
      {!loading && filteredProjects.length === 0 ? <p className="empty-note">No projects match your filters.</p> : null}

      <section className="projects-grid">
        {filteredProjects.map((project) => (
          <Link key={project.project_id} href={`/projects/${project.project_id}`} className="project-list-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.images[0]?.url ?? "/images/project-1.svg"}
              alt={project.images[0]?.alt || `${project.title} thumbnail`}
            />
            <div>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <p className={`project-category ${CATEGORY_CLASS[project.category]}`}>
                {project.category} · Primary tag: {projectPrimaryTag(project)}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}

