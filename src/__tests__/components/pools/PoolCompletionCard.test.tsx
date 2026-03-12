import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PoolCompletionCard } from "@/components/pools/PoolCompletionCard";

// html-to-image does DOM manipulation that isn't relevant to these unit tests.
vi.mock("html-to-image", () => ({ toPng: vi.fn() }));

// Sonner is a side-effect toast library — mock so tests stay silent.
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const BASE_PROPS = {
  poolName: "Test Pool",
  total: 10,
  complete: 6,
  incomplete: 3,
  notStarted: 1,
};

describe("PoolCompletionCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders null when total is 0", () => {
    const { container } = render(
      <PoolCompletionCard
        {...BASE_PROPS}
        total={0}
        complete={0}
        incomplete={0}
        notStarted={0}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the card when there are members", () => {
    render(<PoolCompletionCard {...BASE_PROPS} />);
    expect(screen.getByText("Ballot Status")).toBeInTheDocument();
  });

  it("progress bar has role=img and a descriptive aria-label", () => {
    render(<PoolCompletionCard {...BASE_PROPS} />);
    const bar = screen.getByRole("img", {
      name: /ballot completion/i,
    });
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute(
      "aria-label",
      "Ballot completion: 6 of 10 members complete"
    );
  });

  it("renders sr-only text with exact counts for screen readers", () => {
    render(<PoolCompletionCard {...BASE_PROPS} />);
    // The sr-only span is visually hidden but present in the a11y tree.
    const srText = document.querySelector(".sr-only");
    expect(srText).toBeInTheDocument();
    expect(srText?.textContent).toMatch(/6 complete/);
    expect(srText?.textContent).toMatch(/3 in progress/);
    expect(srText?.textContent).toMatch(/1 not started/);
  });

  it("share button has an accessible label", () => {
    render(<PoolCompletionCard {...BASE_PROPS} />);
    const btn = screen.getByRole("button", {
      name: /share ballot status as image/i,
    });
    expect(btn).toBeInTheDocument();
  });

  it("shows a congratulatory description when all members are complete", () => {
    render(
      <PoolCompletionCard
        {...BASE_PROPS}
        total={5}
        complete={5}
        incomplete={0}
        notStarted={0}
      />
    );
    expect(
      screen.getByText(/all 5 members are ready/i)
    ).toBeInTheDocument();
  });

  it("shows member count in description when not all complete", () => {
    render(<PoolCompletionCard {...BASE_PROPS} />);
    expect(
      screen.getByText(/10 members in this pool/i)
    ).toBeInTheDocument();
  });
});
