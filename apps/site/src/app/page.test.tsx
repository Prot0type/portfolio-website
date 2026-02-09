import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import React from "react";

import HomePage from "./page";

vi.mock("@/lib/api", () => ({
  getPublishedProjects: vi.fn(async () => []),
  recordWebsiteView: vi.fn(async () => undefined)
}));

vi.mock("@/components/highlight-carousel", () => ({
  HighlightCarousel: () => <div>Mock Highlight Carousel</div>
}));

describe("HomePage", () => {
  it("renders main sections", async () => {
    render(<HomePage />);
    expect(screen.getByText("ishani")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/thank you/i)).toBeInTheDocument();
    });
  });
});
