import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import Tooltip from "./Tooltip.svelte";

describe("Tooltip", () => {
  afterEach(() => {
    cleanup();
  });

  it("does not show tooltip text initially", () => {
    const { queryByText } = render(Tooltip, {
      props: {
        text: "(dropped)",
      },
    });

    expect(queryByText("(dropped)")).toBeNull();
  });

  it("shows tooltip text on mouse enter and hides it on mouse leave", async () => {
    const { getByRole, queryByText } = render(Tooltip, {
      props: {
        text: "(dropped)",
      },
    });

    const trigger = getByRole("tooltip");

    await fireEvent.mouseEnter(trigger);
    expect(queryByText("(dropped)")).not.toBeNull();

    await fireEvent.mouseLeave(trigger);
    expect(queryByText("(dropped)")).toBeNull();
  });

  it("renders child content inside the tooltip wrapper", () => {
    const childSnippet = createRawSnippet(() => ({
      render: () => `<span data-testid="tooltip-child">child icon</span>`,
    }));

    const { getByTestId } = render(Tooltip, {
      props: {
        text: "(dropped)",
        children: childSnippet,
      },
    });

    expect(getByTestId("tooltip-child")).toBeDefined();
  });
});
