"use client";

import { AuthShell } from "@/components/auth-shell";
import { CmsDashboard } from "@/components/cms-dashboard";

export default function CmsPage() {
  return (
    <AuthShell>
      {({ userLabel, onSignOut }) => <CmsDashboard userLabel={userLabel} onSignOut={onSignOut} />}
    </AuthShell>
  );
}

