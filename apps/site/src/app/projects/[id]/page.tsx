import { getFallbackProjectSlugs } from "@/lib/api";

import { ProjectDetailClient } from "./project-detail-client";

type ProjectDetailPageProps = {
  params: {
    id: string;
  };
};

export function generateStaticParams() {
  return getFallbackProjectSlugs().map((id) => ({ id }));
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  return <ProjectDetailClient projectSlug={params.id} />;
}
