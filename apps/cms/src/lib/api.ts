import { getAuthToken } from "@/lib/auth";
import type { ProjectInput, ProjectRecord, ProjectStatus } from "@/lib/types";

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
}

function withBase(path: string) {
  return `${apiBase()}${path}`;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  if (!token) {
    return { "Content-Type": "application/json" };
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const headers = await authHeaders();
  const response = await fetch(withBase("/api/projects?status_filter=all"), { headers, cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load projects");
  }
  return (await response.json()) as ProjectRecord[];
}

export async function createProject(input: ProjectInput): Promise<ProjectRecord> {
  const headers = await authHeaders();
  const response = await fetch(withBase("/api/projects"), {
    method: "POST",
    headers,
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error("Unable to create project");
  }
  return (await response.json()) as ProjectRecord;
}

export async function updateProject(projectId: string, input: Partial<ProjectInput>): Promise<ProjectRecord> {
  const headers = await authHeaders();
  const response = await fetch(withBase(`/api/projects/${projectId}`), {
    method: "PUT",
    headers,
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error("Unable to update project");
  }
  return (await response.json()) as ProjectRecord;
}

export async function deleteProject(projectId: string): Promise<void> {
  const headers = await authHeaders();
  const response = await fetch(withBase(`/api/projects/${projectId}`), {
    method: "DELETE",
    headers
  });
  if (!response.ok) {
    throw new Error("Unable to delete project");
  }
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus): Promise<ProjectRecord> {
  const headers = await authHeaders();
  const response = await fetch(withBase(`/api/projects/${projectId}/status`), {
    method: "POST",
    headers,
    body: JSON.stringify({ status })
  });
  if (!response.ok) {
    throw new Error("Unable to update status");
  }
  return (await response.json()) as ProjectRecord;
}

export async function uploadImage(file: File): Promise<{ key: string; publicUrl: string }> {
  const headers = await authHeaders();
  const presign = await fetch(withBase("/api/images/presign"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      file_name: file.name,
      content_type: file.type || "application/octet-stream"
    })
  });
  if (!presign.ok) {
    throw new Error("Unable to get upload URL");
  }
  const data = (await presign.json()) as {
    key: string;
    upload_url: string;
    public_url: string;
  };

  const upload = await fetch(data.upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file
  });
  if (!upload.ok) {
    throw new Error("Unable to upload image");
  }

  return { key: data.key, publicUrl: data.public_url };
}

