import type { ProjectCategory, ProjectRecord } from "@/lib/types";

export const CATEGORY_CLASS: Record<ProjectCategory, string> = {
  Personal: "category-personal",
  College: "category-college",
  Work: "category-work",
  Freelance: "category-freelance"
};

export function projectPrimaryTag(project: ProjectRecord): string {
  return project.tags[0] ?? "";
}

export function uniqueProjectTags(projects: ProjectRecord[]): string[] {
  const set = new Set<string>();
  projects.forEach((project) => {
    project.tags.forEach((tag) => set.add(tag));
  });
  return [...set].sort((a, b) => a.localeCompare(b));
}

