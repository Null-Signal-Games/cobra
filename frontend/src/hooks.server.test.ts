import { describe, it, expect, vi } from "vitest";
import type { RequestEvent } from "@sveltejs/kit";

vi.mock("$app/env/private", () => ({
  SERVER_COBRA_API_ENDPOINT: "http://gateway",
}));

const { handleFetch } = await import("./hooks.server");

function eventWithCookie(cookie?: string): RequestEvent {
  const headers = new Headers();
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return {
    request: new Request("https://tournaments.nullsignal.games/tournaments/1", { headers }),
  } as RequestEvent;
}

async function forwardedRequest(event: RequestEvent, request: Request): Promise<Request> {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response());
  await handleFetch({ event, request, fetch });
  return fetch.mock.calls[0][0] as Request;
}

describe("handleFetch", () => {
  it("rewrites API requests to the internal host and forwards the session cookie", async () => {
    const forwarded = await forwardedRequest(
      eventWithCookie("_cobra_session=abc"),
      new Request("https://tournaments.nullsignal.games/api/v1/private/user"),
    );

    expect(forwarded.url).toBe("http://gateway/api/v1/private/user");
    expect(forwarded.headers.get("cookie")).toBe("_cobra_session=abc");
  });

  it("does not forward cookies when the request omits credentials", async () => {
    const forwarded = await forwardedRequest(
      eventWithCookie("_cobra_session=abc"),
      new Request("https://tournaments.nullsignal.games/beta/tournaments/1", { credentials: "omit" }),
    );

    expect(forwarded.headers.get("cookie")).toBeNull();
  });

  it("leaves non-API requests alone", async () => {
    const forwarded = await forwardedRequest(
      eventWithCookie("_cobra_session=abc"),
      new Request("https://tournaments.nullsignal.games/favicon.ico"),
    );

    expect(forwarded.url).toBe("https://tournaments.nullsignal.games/favicon.ico");
    expect(forwarded.headers.get("cookie")).toBeNull();
  });
});
