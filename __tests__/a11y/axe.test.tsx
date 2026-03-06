import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";

const mockCategories = [
  {
    id: "cat-1",
    name: "Best Picture",
    displayOrder: 0,
    pointValue: 10,
    winnerId: "nom-1",
    winnerName: "Test Movie",
  },
];

const mockEntries = [
  {
    poolMemberId: "pm-1",
    userId: "user-1",
    userName: "Alice",
    userImage: null,
    totalScore: 10,
    rank: 1,
    correctFirstChoices: 1,
    correctRunnerUps: 0,
    breakdown: [
      {
        categoryId: "cat-1",
        categoryName: "Best Picture",
        pointValue: 10,
        runnerUpMultiplier: 0.5,
        firstChoiceId: "nom-1",
        runnerUpId: "nom-2",
        winnerId: "nom-1",
        points: 10,
        isFirstChoiceCorrect: true,
        isRunnerUpCorrect: false,
      },
    ],
  },
];

describe("LeaderboardTable accessibility", () => {
  it("should have no axe violations", async () => {
    const { container } = render(
      <LeaderboardTable
        entries={mockEntries}
        categories={mockCategories}
        currentUserId="user-1"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
