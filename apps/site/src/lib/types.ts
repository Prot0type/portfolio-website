export type ProjectStatus = "draft" | "published";
export type ProjectCategory = "Personal" | "College" | "Work" | "Freelance";

export type ProjectImage = {
  key: string;
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
};

export type ProjectRecord = {
  project_id: string;
  title: string;
  description: string;
  tags: string[];
  category: ProjectCategory;
  project_date: string;
  images: ProjectImage[];
  is_highlighted: boolean;
  status: ProjectStatus;
  sort_order: number;
  extra: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function getPrimaryTag(project: ProjectRecord): string {
  return project.tags[0] ?? "";
}
