"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
  updateProjectStatus,
  uploadImage
} from "@/lib/api";
import type { ProjectCategory, ProjectImage, ProjectInput, ProjectRecord, ProjectStatus } from "@/lib/types";

const CATEGORY_OPTIONS: ProjectCategory[] = ["Personal", "College", "Work", "Freelance"];

function generateProjectId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `project-${Date.now()}`;
}

function newFormState(): ProjectInput {
  return {
    project_id: generateProjectId(),
    title: "",
    description: "",
    tags: [],
    category: "Personal",
    project_date: new Date().toISOString().slice(0, 10),
    images: [],
    is_highlighted: false,
    status: "draft",
    sort_order: 0,
    extra: {}
  };
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function tagsToInput(value: string[]): string {
  return value.join(", ");
}

function validateForStatus(tags: string[], category: ProjectCategory | undefined): string | null {
  if (!category) {
    return "Category is required before saving.";
  }
  if (tags.length === 0) {
    return "At least one tag is required. The first tag is the primary tag.";
  }
  return null;
}

type CmsDashboardProps = {
  userLabel: string;
  onSignOut?: () => void;
};

export function CmsDashboard({ userLabel, onSignOut }: CmsDashboardProps) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [form, setForm] = useState<ProjectInput>(newFormState());
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.project_id === form.project_id),
    [projects, form.project_id]
  );

  async function refresh() {
    setLoading(true);
    try {
      const data = await listProjects();
      setProjects(data);
      setNotice(null);
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);

  function editProject(project: ProjectRecord) {
    setForm({
      project_id: project.project_id,
      title: project.title,
      description: project.description,
      tags: project.tags,
      category: project.category,
      project_date: project.project_date,
      images: project.images,
      is_highlighted: project.is_highlighted,
      status: project.status,
      sort_order: project.sort_order,
      extra: project.extra ?? {}
    });
    setTagInput(tagsToInput(project.tags));
  }

  function resetForm() {
    setForm(newFormState());
    setTagInput("");
  }

  function updateField<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function save() {
    const parsedTags = parseTags(tagInput);
    const validationError = validateForStatus(parsedTags, form.category);
    if (validationError) {
      setNotice(validationError);
      return;
    }

    setSaving(true);
    try {
      const payload: ProjectInput = {
        ...form,
        tags: parsedTags
      };

      if (selectedProject) {
        const { project_id: _discarded, ...patch } = payload;
        await updateProject(form.project_id, patch);
        setNotice("Project updated");
      } else {
        await createProject(payload);
        setNotice("Project created");
      }
      await refresh();
      resetForm();
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(projectId: string) {
    if (!window.confirm("Delete this project?")) {
      return;
    }
    try {
      await deleteProject(projectId);
      setNotice("Project deleted");
      await refresh();
      if (form.project_id === projectId) {
        resetForm();
      }
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  async function setStatus(projectId: string, status: ProjectStatus) {
    const target = projects.find((project) => project.project_id === projectId);
    if (!target) {
      setNotice("Project not found");
      return;
    }
    const validationError = validateForStatus(target.tags, target.category);
    if (validationError) {
      setNotice(validationError);
      return;
    }

    try {
      await updateProjectStatus(projectId, status);
      setNotice(`Project set to ${status}`);
      await refresh();
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  async function onImageSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadImage(file);
      const imageEntry: ProjectImage = { key: uploaded.key, url: uploaded.publicUrl, alt: form.title || file.name };
      updateField("images", [...form.images, imageEntry]);
      setNotice("Image added");
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <main className="cms-shell">
      <header className="cms-header">
        <div>
          <p className="eyebrow">Portfolio CMS</p>
          <h1>Project Administration</h1>
          <p className="subtitle">Signed in as {userLabel}</p>
        </div>
        <div className="actions">
          <button type="button" onClick={resetForm}>
            New Project
          </button>
          {onSignOut ? (
            <button type="button" onClick={onSignOut}>
              Sign Out
            </button>
          ) : null}
        </div>
      </header>

      {notice ? <p className="notice">{notice}</p> : null}

      <section className="cms-layout">
        <article className="editor">
          <h2>{selectedProject ? "Edit Project" : "Create Project"}</h2>
          <label>
            Project ID
            <input value={form.project_id} onChange={(event) => updateField("project_id", event.target.value)} />
          </label>
          <label>
            Title
            <input value={form.title} onChange={(event) => updateField("title", event.target.value)} />
          </label>
          <label>
            Description
            <textarea
              rows={5}
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>
          <label>
            Tags (first tag is required and primary)
            <input value={tagInput} onChange={(event) => setTagInput(event.target.value)} />
          </label>
          <p className="helper-text">Use commas to separate tags. Example: ux, mobile, usability</p>

          <div className="split">
            <label>
              Category
              <select value={form.category} onChange={(event) => updateField("category", event.target.value as ProjectCategory)}>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input
                type="date"
                value={form.project_date}
                onChange={(event) => updateField("project_date", event.target.value)}
              />
            </label>
            <label>
              Sort Order
              <input
                type="number"
                value={form.sort_order}
                onChange={(event) => updateField("sort_order", Number(event.target.value))}
              />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(event) => updateField("status", event.target.value as ProjectStatus)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.is_highlighted}
              onChange={(event) => updateField("is_highlighted", event.target.checked)}
            />
            <span>Highlighted project (shown on home carousel)</span>
          </label>

          <label>
            Upload Image
            <input type="file" accept="image/*" onChange={onImageSelect} disabled={uploading} />
          </label>
          <p className="helper-text">
            In local mode (`NEXT_PUBLIC_ENABLE_AUTH=false`), uploads use local preview URLs when S3 is unavailable.
          </p>

          <ul className="image-list">
            {form.images.map((image, index) => (
              <li key={image.key}>
                <input
                  value={image.url}
                  onChange={(event) => {
                    const next = [...form.images];
                    next[index] = { ...next[index], url: event.target.value };
                    updateField("images", next);
                  }}
                />
                <input
                  value={image.alt}
                  onChange={(event) => {
                    const next = [...form.images];
                    next[index] = { ...next[index], alt: event.target.value };
                    updateField("images", next);
                  }}
                />
                <button
                  type="button"
                  onClick={() => updateField("images", form.images.filter((item) => item.key !== image.key))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <button type="button" onClick={save} disabled={saving || !form.title || !form.description}>
            {saving ? "Saving..." : selectedProject ? "Update Project" : "Create Project"}
          </button>
        </article>

        <article className="project-list">
          <h2>All Projects</h2>
          {loading ? <p>Loading...</p> : null}
          {!loading && projects.length === 0 ? <p>No projects yet.</p> : null}
          <ul>
            {projects.map((project) => (
              <li key={project.project_id}>
                <div>
                  <h3>{project.title}</h3>
                  <p>{project.project_date}</p>
                  <p>
                    {project.category} · Primary tag: {project.tags[0] ?? "-"}
                  </p>
                  <span className={`status status-${project.status}`}>{project.status}</span>
                  {project.is_highlighted ? <span className="highlight-pill">highlighted</span> : null}
                </div>
                <div className="row-actions">
                  <button type="button" onClick={() => editProject(project)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(project.project_id, project.status === "draft" ? "published" : "draft")}
                  >
                    {project.status === "draft" ? "Publish" : "Unpublish"}
                  </button>
                  <button type="button" onClick={() => remove(project.project_id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}

