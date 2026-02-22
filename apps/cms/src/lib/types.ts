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
  project_short_name: string;
  project_slug: string;
  title: string;
  description: string;
  tags: string[];
  category: ProjectCategory;
  project_date: string;
  thumbnail: ProjectImage;
  images: ProjectImage[];
  is_highlighted: boolean;
  status: ProjectStatus;
  sort_order: number;
  extra: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ProjectInput = Omit<ProjectRecord, "created_at" | "updated_at">;

export type SiteContentRecord = {
  bio_main: string;
  bio_secondary: string;
  updated_at: string;
};

export type SiteContentInput = {
  bio_main: string;
  bio_secondary: string;
};
