import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import React from "react";

import HomePage from "./page";

vi.mock("@/lib/api", () => ({
  getPublishedProjects: vi.fn(async () => []),
  recordWebsiteView: vi.fn(async () => undefined)
}));

vi.mock("@/components/project-carousel", () => ({
  ProjectCarousel: () => <div>Mock Carousel</div>
}));

describe("HomePage", () => {
  it("renders main sections", async () => {
    render(<HomePage />);
    expect(screen.getByText(/Building high-impact digital products/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Find me online/i)).toBeInTheDocument();
    });
  });
});
