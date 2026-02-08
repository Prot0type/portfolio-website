import type { ProjectRecord } from "./types";

const DEFAULT_PROJECTS: ProjectRecord[] = [
  {
    project_id: "placeholder-1",
    title: "Immersive Product Story",
    description:
      "A performance-focused experience with scroll choreography, smooth fades, and a lightweight animation budget.",
    tags: ["next.js", "framer-motion", "cloudfront"],
    project_date: "2026-02-08",
    images: [
      { key: "hero-1", url: "/images/project-1.svg", alt: "Gradient poster for placeholder project 1" },
      { key: "hero-2", url: "/images/project-2.svg", alt: "Gradient poster for placeholder project 2" }
    ],
    status: "published",
    sort_order: 10,
    extra: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    project_id: "placeholder-2",
    title: "Design Systems Playground",
    description: "Component-driven frontend architecture with reusable cards, tags, and timeline modules.",
    tags: ["typescript", "design-system", "aws"],
    project_date: "2026-01-18",
    images: [{ key: "hero-3", url: "/images/project-3.svg", alt: "Gradient poster for placeholder project 3" }],
    status: "published",
    sort_order: 8,
    extra: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
}

function pathWithBase(path: string): string {
  const base = apiBase();
  return `${base}${path}`;
}

export async function getPublishedProjects(): Promise<ProjectRecord[]> {
  try {
    const response = await fetch(pathWithBase("/api/projects?status_filter=published"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    });
    if (!response.ok) {
      return DEFAULT_PROJECTS;
    }
    return (await response.json()) as ProjectRecord[];
  } catch {
    return DEFAULT_PROJECTS;
  }
}

export async function recordWebsiteView() {
  if (typeof window === "undefined") {
    return;
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const gateKey = `portfolio-view-${todayKey}`;
  if (window.localStorage.getItem(gateKey)) {
    return;
  }

  window.localStorage.setItem(gateKey, "1");
  await fetch(pathWithBase("/api/metrics/view"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page: "/", source: "public-site" })
  }).catch(() => undefined);
}

