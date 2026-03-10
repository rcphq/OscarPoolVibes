import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { InviteShareButtons } from "@/components/pools/InviteShareButtons"

const defaultProps = {
  inviteUrl: "https://example.com/pools/join?code=abc123",
  poolName: "Film Buffs 2026",
  inviteCode: "abc123",
}

describe("InviteShareButtons", () => {
  it("renders all three share buttons and the invite code", () => {
    render(<InviteShareButtons {...defaultProps} />)

    expect(screen.getByRole("button", { name: /copy invite link/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /share on whatsapp/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /share on x/i })).toBeInTheDocument()
    expect(screen.getByText(defaultProps.inviteCode)).toBeInTheDocument()
  })

  it("shows 'Copied' feedback after clicking copy button", async () => {
    // Mock clipboard API — define before render so component sees it
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
      configurable: true,
    })

    const user = userEvent.setup()
    render(<InviteShareButtons {...defaultProps} />)

    await user.click(screen.getByRole("button", { name: /copy invite link/i }))

    // The component calls clipboard API and shows feedback
    await waitFor(() => {
      expect(screen.getByText("Copied")).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /invite link copied/i })).toBeInTheDocument()
  })

  it("WhatsApp link has correct URL with encoded message", () => {
    render(<InviteShareButtons {...defaultProps} />)

    const whatsappLink = screen.getByRole("link", { name: /share on whatsapp/i })
    const expectedMessage = `Join my Oscar pool '${defaultProps.poolName}': ${defaultProps.inviteUrl}`
    expect(whatsappLink).toHaveAttribute(
      "href",
      `https://wa.me/?text=${encodeURIComponent(expectedMessage)}`
    )
    expect(whatsappLink).toHaveAttribute("target", "_blank")
    expect(whatsappLink).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("X/Twitter link has correct URL with encoded message", () => {
    render(<InviteShareButtons {...defaultProps} />)

    const twitterLink = screen.getByRole("link", { name: /share on x/i })
    const expectedMessage = `Join my Oscar pool '${defaultProps.poolName}': ${defaultProps.inviteUrl}`
    expect(twitterLink).toHaveAttribute(
      "href",
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(expectedMessage)}`
    )
    expect(twitterLink).toHaveAttribute("target", "_blank")
  })
})
