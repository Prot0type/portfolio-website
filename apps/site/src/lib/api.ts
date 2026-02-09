import type { ProjectRecord } from "./types";

const nowIso = new Date().toISOString();

const DEFAULT_PROJECTS: ProjectRecord[] = [
  {
    project_id: "placeholder-1",
    title: "Retail Journey Redesign",
    description: "UX refresh for a cross-device shopping journey with structured interaction states.",
    tags: ["ux", "interaction", "prototype"],
    category: "Work",
    project_date: "2026-02-08",
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
    title: "Accessible Design Audit",
    description: "Audit toolkit and visual language updates focused on accessibility and clarity.",
    tags: ["a11y", "research", "system"],
    category: "Freelance",
    project_date: "2026-01-18",
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
    title: "Campus Events Experience",
    description: "Student-centric mobile-first navigation and event discovery concept.",
    tags: ["mobile", "campus", "ux-writing"],
    category: "College",
    project_date: "2025-12-12",
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

export function getFallbackProjectIds(): string[] {
  return DEFAULT_PROJECTS.map((project) => project.project_id);
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

