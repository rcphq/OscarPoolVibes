import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { PreResultsLeaderboard } from "@/components/leaderboard/PreResultsLeaderboard"

const defaultProps = {
  poolName: "Film Buffs 2026",
  ceremonyName: "98th Academy Awards",
  currentUserName: "Alice",
  currentUserImage: null,
  currentUserPredictionCount: 15,
  totalCategories: 23,
  memberCount: 5,
}

describe("PreResultsLeaderboard", () => {
  it("renders status banner with locked message", () => {
    render(<PreResultsLeaderboard {...defaultProps} />)

    expect(screen.getByText(/predictions locked/i)).toBeInTheDocument()
    expect(screen.getByText(/awaiting ceremony results/i)).toBeInTheDocument()
  })

  it("shows current user name and prediction count", () => {
    render(<PreResultsLeaderboard {...defaultProps} />)

    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("15 of 23 categories predicted")).toBeInTheDocument()
  })

  it("shows correct completion percentage", () => {
    render(<PreResultsLeaderboard {...defaultProps} />)

    // 15/23 = 65%
    expect(screen.getByText("65%")).toBeInTheDocument()
  })

  it("shows 100% when all categories predicted", () => {
    render(
      <PreResultsLeaderboard
        {...defaultProps}
        currentUserPredictionCount={23}
      />
    )

    expect(screen.getByText("100%")).toBeInTheDocument()
  })

  it("shows 0% when no predictions made", () => {
    render(
      <PreResultsLeaderboard
        {...defaultProps}
        currentUserPredictionCount={0}
      />
    )

    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("shows member count with correct pluralization", () => {
    render(<PreResultsLeaderboard {...defaultProps} />)
    expect(screen.getByText("5 members competing")).toBeInTheDocument()
  })

  it("uses singular 'member' for count of 1", () => {
    render(<PreResultsLeaderboard {...defaultProps} memberCount={1} />)
    expect(screen.getByText("1 member competing")).toBeInTheDocument()
  })

  it("shows sealed categories count", () => {
    render(<PreResultsLeaderboard {...defaultProps} />)
    expect(screen.getByText(/23 categories .* awaiting results/)).toBeInTheDocument()
  })

  it("shows fallback initial when no user image", () => {
    render(<PreResultsLeaderboard {...defaultProps} currentUserImage={null} />)

    // First letter of "Alice" = "A"
    expect(screen.getByText("A")).toBeInTheDocument()
  })

  it("shows '?' initial for anonymous user", () => {
    render(
      <PreResultsLeaderboard
        {...defaultProps}
        currentUserName={null}
        currentUserImage={null}
      />
    )

    expect(screen.getByText("?")).toBeInTheDocument()
    expect(screen.getByText("Anonymous")).toBeInTheDocument()
  })
})
