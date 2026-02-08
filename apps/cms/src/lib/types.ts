export type ProjectStatus = "draft" | "published";

export type ProjectImage = {
  key: string;
  url: string;
  alt: string;
};

export type ProjectRecord = {
  project_id: string;
  title: string;
  description: string;
  tags: string[];
  project_date: string;
  images: ProjectImage[];
  status: ProjectStatus;
  sort_order: number;
  extra: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ProjectInput = Omit<ProjectRecord, "created_at" | "updated_at">;

