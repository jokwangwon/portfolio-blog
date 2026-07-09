import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MotionSection } from "./MotionSection";

// Mock framer-motion to avoid animation side effects in tests
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    useInView: () => true,
  };
});

describe("MotionSection", () => {
  let matchMediaMock: {
    matches: boolean;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    matchMediaMock = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal("matchMedia", vi.fn(() => matchMediaMock));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders children", () => {
    render(
      <MotionSection>
        <p>Test content</p>
      </MotionSection>
    );
    expect(screen.getByText("Test content")).toBeDefined();
  });

  it("applies className to the section", () => {
    const { container } = render(
      <MotionSection className="test-class">
        <p>Content</p>
      </MotionSection>
    );
    const section = container.querySelector("section");
    expect(section?.className).toContain("test-class");
  });

  it("applies id to the section", () => {
    const { container } = render(
      <MotionSection id="test-id">
        <p>Content</p>
      </MotionSection>
    );
    const section = container.querySelector("#test-id");
    expect(section).toBeDefined();
  });

  it("renders as a section element", () => {
    const { container } = render(
      <MotionSection>
        <p>Content</p>
      </MotionSection>
    );
    const section = container.querySelector("section");
    expect(section).not.toBeNull();
  });
});
