import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { goto } from "$app/navigation";
import NotFoundPage from "./+page.svelte";

vi.mock("$app/navigation", () => ({ goto: vi.fn() }));

const user = userEvent.setup();

describe("Not found page", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  function renderPage(code: string) {
    render(NotFoundPage, { props: { data: { code, icon: "🤔" } } as never });
  }

  it("says the tournament wasn't found and offers the code to retry", () => {
    renderPage("nosuch");

    expect(screen.getByText("Couldn't find that tournament!")).toBeInTheDocument();
    expect(screen.getByLabelText("Try again?")).toHaveValue("NOSUCH");
  });

  it("goes to a corrected shortcode", async () => {
    renderPage("nosuch");

    const input = screen.getByLabelText("Try again?");
    await user.clear(input);
    await user.type(input, " abcd ");
    await user.click(screen.getByRole("button", { name: /Go to tournament/ }));

    expect(goto).toHaveBeenCalledWith("/ABCD");
  });
});
