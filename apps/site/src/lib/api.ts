import type { ProjectRecord, SiteContentRecord } from "./types";

const nowIso = new Date().toISOString();
export const DEFAULT_SITE_CONTENT: SiteContentRecord = {
  bio_main: "IITH graduate with 3+ years of experience and a passion to create.",
  bio_secondary: "Mi khoop katkat karte.",
  updated_at: nowIso
};

const DEFAULT_PROJECTS: ProjectRecord[] = [
  {
    project_id: "placeholder-1",
    project_short_name: "Retail Journey Redesign",
    project_slug: "retail-journey-redesign",
    title: "Retail Journey Redesign",
    description: "UX refresh for a cross-device shopping journey with structured interaction states.",
    tags: ["ux", "interaction", "prototype"],
    category: "Work",
    project_date: "2026-02-08",
    thumbnail: { key: "thumb-1", url: "/images/project-1.svg", alt: "Retail journey redesign thumbnail" },
    images: [{ key: "hero-1", url: "/images/project-1.svg", alt: "Retail journey redesign placeholder poster" }],
    is_highlighted: true,
    status: "published",
    sort_order: 10,
    extra: {},
    created_at: nowIso,
    updated_at: nowIso
  },
  {
    project_id: "placeholder-2",
    project_short_name: "Accessible Design Audit",
    project_slug: "accessible-design-audit",
    title: "Accessible Design Audit",
    description: "Audit toolkit and visual language updates focused on accessibility and clarity.",
    tags: ["a11y", "research", "system"],
    category: "Freelance",
    project_date: "2026-01-18",
    thumbnail: { key: "thumb-2", url: "/images/project-2.svg", alt: "Accessibility audit thumbnail" },
    images: [{ key: "hero-2", url: "/images/project-2.svg", alt: "Accessibility design audit placeholder poster" }],
    is_highlighted: true,
    status: "published",
    sort_order: 8,
    extra: {},
    created_at: nowIso,
    updated_at: nowIso
  },
  {
    project_id: "placeholder-3",
    project_short_name: "Campus Events Experience",
    project_slug: "campus-events-experience",
    title: "Campus Events Experience",
    description: "Student-centric mobile-first navigation and event discovery concept.",
    tags: ["mobile", "campus", "ux-writing"],
    category: "College",
    project_date: "2025-12-12",
    thumbnail: { key: "thumb-3", url: "/images/project-3.svg", alt: "Campus events thumbnail" },
    images: [{ key: "hero-3", url: "/images/project-3.svg", alt: "Campus events placeholder poster" }],
    is_highlighted: false,
    status: "published",
    sort_order: 6,
    extra: {},
    created_at: nowIso,
    updated_at: nowIso
  }
];

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
}

function pathWithBase(path: string): string {
  const base = apiBase();
  return `${base}${path}`;
}

function sortProjects(projects: ProjectRecord[]) {
  return [...projects].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return b.sort_order - a.sort_order;
    }
    return b.project_date.localeCompare(a.project_date);
  });
}

export async function getPublishedProjects(): Promise<ProjectRecord[]> {
  try {
    const response = await fetch(pathWithBase("/api/projects?status_filter=published"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    });
    if (!response.ok) {
      return sortProjects(DEFAULT_PROJECTS);
    }
    const data = (await response.json()) as ProjectRecord[];
    return sortProjects(data);
  } catch {
    return sortProjects(DEFAULT_PROJECTS);
  }
}

export async function getPublishedProjectById(projectId: string): Promise<ProjectRecord | null> {
  try {
    const response = await fetch(pathWithBase(`/api/projects/${projectId}`), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    });
    if (!response.ok) {
      return DEFAULT_PROJECTS.find((project) => project.project_id === projectId) ?? null;
    }
    const data = (await response.json()) as ProjectRecord;
    return data.status === "published" ? data : null;
  } catch {
    return DEFAULT_PROJECTS.find((project) => project.project_id === projectId) ?? null;
  }
}

export async function getPublishedProjectBySlug(projectSlug: string): Promise<ProjectRecord | null> {
  try {
    const response = await fetch(pathWithBase(`/api/projects/by-slug/${encodeURIComponent(projectSlug)}`), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    });
    if (!response.ok) {
      return DEFAULT_PROJECTS.find((project) => project.project_slug === projectSlug) ?? null;
    }
    const data = (await response.json()) as ProjectRecord;
    return data.status === "published" ? data : null;
  } catch {
    return DEFAULT_PROJECTS.find((project) => project.project_slug === projectSlug) ?? null;
  }
}

export function getFallbackProjectSlugs(): string[] {
  return DEFAULT_PROJECTS.map((project) => project.project_slug);
}

export async function getSiteContent(): Promise<SiteContentRecord> {
  try {
    const response = await fetch(pathWithBase("/api/site-content"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    });
    if (!response.ok) {
      return DEFAULT_SITE_CONTENT;
    }
    return (await response.json()) as SiteContentRecord;
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export async function recordWebsiteView(page: string) {
  if (typeof window === "undefined") {
    return;
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const gateKey = `portfolio-view-${todayKey}-${page}`;
  if (window.localStorage.getItem(gateKey)) {
    return;
  }

  window.localStorage.setItem(gateKey, "1");
  await fetch(pathWithBase("/api/metrics/view"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page, source: "public-site" })
  }).catch(() => undefined);
}
