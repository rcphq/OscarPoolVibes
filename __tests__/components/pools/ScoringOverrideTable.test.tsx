import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScoringOverrideTable } from "@/components/pools/ScoringOverrideTable";

const updateCategoryScoring = vi.fn();
const revertScoringToDefaults = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@/app/pools/[id]/scoring/actions", () => ({
  updateCategoryScoring: (...args: unknown[]) => updateCategoryScoring(...args),
  revertScoringToDefaults: (...args: unknown[]) => revertScoringToDefaults(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

function makeCategory(overrides: Partial<Parameters<typeof ScoringOverrideTable>[0]["categories"][number]> = {}) {
  return {
    id: "cat-1",
    name: "Best Picture",
    displayOrder: 1,
    pointValue: 180,
    runnerUpPoints: 108,
    defaults: {
      pointValue: 180,
      runnerUpMultiplier: 0.6,
    },
    ...overrides,
  };
}

describe("ScoringOverrideTable", () => {
  beforeEach(() => {
    updateCategoryScoring.mockReset();
    revertScoringToDefaults.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();

    updateCategoryScoring.mockResolvedValue({ success: true });
    revertScoringToDefaults.mockResolvedValue({ success: true });
  });

  it("renders categories that are not in the preset tier list", () => {
    render(
      <ScoringOverrideTable
        poolId="pool-1"
        ceremonyYearName="98th Academy Awards"
        categories={[
          makeCategory(),
          makeCategory({
            id: "cat-2",
            name: "Best Stunts",
            displayOrder: 2,
            pointValue: 25,
            runnerUpPoints: 10,
            defaults: {
              pointValue: 15,
              runnerUpMultiplier: 0.6,
            },
          }),
        ]}
      />
    );

    expect(screen.getByText("Additional Categories")).toBeInTheDocument();
    expect(screen.getByText("Best Stunts")).toBeInTheDocument();
  });

  it("shows the ceremony-wide revert action before any edits are made", () => {
    render(
      <ScoringOverrideTable
        poolId="pool-1"
        ceremonyYearName="98th Academy Awards"
        categories={[makeCategory()]}
      />
    );

    expect(
      screen.getByRole("button", { name: /revert all to defaults/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save changes/i })
    ).not.toBeInTheDocument();
  });

  it("resets an overridden row to defaults and saves the default values", async () => {
    const user = userEvent.setup();

    render(
      <ScoringOverrideTable
        poolId="pool-1"
        ceremonyYearName="98th Academy Awards"
        categories={[
          makeCategory({
            pointValue: 200,
            runnerUpPoints: 100,
          }),
        ]}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /reset best picture to defaults/i })
    );

    expect(
      screen.getByLabelText(/best picture - 1st place points/i)
    ).toHaveValue(180);
    expect(
      screen.getByLabelText(/best picture - 2nd place points/i)
    ).toHaveValue(108);

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(updateCategoryScoring).toHaveBeenCalledWith("pool-1", [
      {
        categoryId: "cat-1",
        pointValue: 180,
        runnerUpPoints: 108,
      },
    ]);
  });
});
