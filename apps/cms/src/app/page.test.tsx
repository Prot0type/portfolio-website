import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import type { ReactNode } from "react";
import React from "react";

import CmsPage from "./page";

vi.mock("@/components/auth-shell", () => ({
  AuthShell: ({ children }: { children: (args: { userLabel: string }) => ReactNode }) =>
    <>{children({ userLabel: "local-admin" })}</>
}));

vi.mock("@/components/cms-dashboard", () => ({
  CmsDashboard: ({ userLabel }: { userLabel: string }) => <div>Dashboard user: {userLabel}</div>
}));

describe("CmsPage", () => {
  it("renders dashboard inside auth shell", () => {
    render(<CmsPage />);
    expect(screen.getByText("Dashboard user: local-admin")).toBeInTheDocument();
  });
});
