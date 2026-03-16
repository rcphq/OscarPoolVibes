import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { WhatIfSimulator } from "@/components/leaderboard/WhatIfSimulator"

// Mock the LeaderboardTable to avoid deep rendering
vi.mock("@/components/leaderboard/LeaderboardTable", () => ({
  LeaderboardTable: ({ entries }: { entries: unknown[] }) => (
    <div data-testid="leaderboard-table">
      {entries.length} entries
    </div>
  ),
}))

const makeCategory = (id: string, name: string, order: number) => ({
  id,
  name,
  displayOrder: order,
  pointValue: 10,
  runnerUpMultiplier: 0.6,
  winnerId: null,
  winner: null,
  nominees: [
    { id: `${id}-nom-1`, name: `${name} Nominee A`, subtitle: null },
    { id: `${id}-nom-2`, name: `${name} Nominee B`, subtitle: "Film Title" },
  ],
})

const makeLeaderboardInput = (userId: string, userName: string, categoryIds: string[]) => ({
  poolMemberId: `pm-${userId}`,
  userId,
  userName,
  userImage: null,
  predictions: categoryIds.map((catId) => ({
    categoryId: catId,
    categoryName: `Category ${catId}`,
    pointValue: 10,
    runnerUpMultiplier: 0.6,
    winnerId: null,
    tiedWinnerId: null,
    firstChoiceId: `${catId}-nom-1`,
    runnerUpId: `${catId}-nom-2`,
  })),
})

const defaultProps = {
  categories: [
    makeCategory("cat-1", "Best Picture", 1),
    makeCategory("cat-2", "Best Director", 2),
  ],
  leaderboardInputs: [
    makeLeaderboardInput("user-1", "Alice", ["cat-1", "cat-2"]),
    makeLeaderboardInput("user-2", "Bob", ["cat-1", "cat-2"]),
  ],
  currentUserId: "user-1",
}

describe("WhatIfSimulator", () => {
  it("renders the 'What If?' trigger button", () => {
    render(<WhatIfSimulator {...defaultProps} />)

    expect(screen.getByText("What If?")).toBeInTheDocument()
  })

  it("does not show simulation banner initially", () => {
    render(<WhatIfSimulator {...defaultProps} />)

    expect(screen.queryByText(/simulation/i)).not.toBeInTheDocument()
  })

  it("opens sheet when trigger is clicked", async () => {
    const user = userEvent.setup()
    render(<WhatIfSimulator {...defaultProps} />)

    await user.click(screen.getByText("What If?"))

    expect(screen.getByText("What If? Simulator")).toBeInTheDocument()
    expect(screen.getByText("Randomize All")).toBeInTheDocument()
  })

  it("shows categories sorted by displayOrder in sheet", async () => {
    const user = userEvent.setup()
    render(<WhatIfSimulator {...defaultProps} />)

    await user.click(screen.getByText("What If?"))

    const labels = screen.getAllByText(/Best (Picture|Director)/)
    expect(labels[0]).toHaveTextContent("Best Picture")
    expect(labels[1]).toHaveTextContent("Best Director")
  })

  it("shows 'Decided' badge for categories with real winners", async () => {
    const user = userEvent.setup()
    const propsWithWinner = {
      ...defaultProps,
      categories: [
        {
          ...makeCategory("cat-1", "Best Picture", 1),
          winnerId: "cat-1-nom-1",
          winner: { id: "cat-1-nom-1", name: "Best Picture Nominee A" },
        },
        makeCategory("cat-2", "Best Director", 2),
      ],
    }

    render(<WhatIfSimulator {...propsWithWinner} />)
    await user.click(screen.getByText("What If?"))

    expect(screen.getByText("Decided")).toBeInTheDocument()
    expect(screen.getByText("Actual winner: Best Picture Nominee A")).toBeInTheDocument()
  })

  it("randomize fills all categories and shows simulation", async () => {
    const user = userEvent.setup()
    render(<WhatIfSimulator {...defaultProps} />)

    await user.click(screen.getByText("What If?"))
    await user.click(screen.getByText("Randomize All"))

    // Simulation banner should appear
    expect(screen.getByText(/simulation/i)).toBeInTheDocument()
    // Leaderboard table should render
    expect(screen.getByTestId("leaderboard-table")).toBeInTheDocument()
    // Counter should show 2/2
    expect(screen.getByText("(2/2 set)")).toBeInTheDocument()
  })

  it("reset clears simulation", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<WhatIfSimulator {...defaultProps} />)

    await user.click(screen.getByText("What If?"))
    await user.click(screen.getByText("Randomize All"))

    // Should show simulation
    expect(screen.getByText(/simulation/i)).toBeInTheDocument()

    // Click Reset in the simulation banner (first Reset is inside the banner)
    const resetButtons = screen.getAllByText("Reset")
    await user.click(resetButtons[0])

    // Simulation should be cleared
    expect(screen.queryByTestId("leaderboard-table")).not.toBeInTheDocument()
  })

  it("shows description text in sheet", async () => {
    const user = userEvent.setup()
    render(<WhatIfSimulator {...defaultProps} />)

    await user.click(screen.getByText("What If?"))

    expect(
      screen.getByText(/pick hypothetical winners to see how the leaderboard would change/i)
    ).toBeInTheDocument()
  })
})
