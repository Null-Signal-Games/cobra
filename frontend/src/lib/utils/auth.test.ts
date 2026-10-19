import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authStore } from "./auth.svelte";

describe("authStore (SvelteKit frontend)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authStore.user = null;
    authStore.isLoading = true;
  });

  it("should populate user on HTTP 200 response", async () => {
    const mockUserResponse = {
      data: {
        id: "42",
        attributes: {
          nrdb_id: 12345,
          nrdb_username: "runner_one",
        },
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockUserResponse), { status: 200 }),
    );

    const user = await authStore.checkAuth();

    expect(user).toEqual({
      id: 42,
      nrdb_id: 12345,
      nrdb_username: "runner_one",
    });
    expect(authStore.isAuthenticated).toBe(true);
  });

  it("should set user to null on HTTP 401 response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ errors: [{ status: "401" }] }), { status: 401 }),
    );

    const user = await authStore.checkAuth();

    expect(user).toBeNull();
    expect(authStore.isAuthenticated).toBe(false);
  });

  describe("getCsrfToken", () => {
    beforeEach(() => {
      authStore.clearCsrfToken();
      // The token is only cached in the browser.
      vi.stubGlobal("window", {});
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("fetches the token once and caches it", async () => {
      const mockFetch = vi
        .fn<typeof fetch>()
        .mockImplementation(() =>
          Promise.resolve(new Response(JSON.stringify({ csrf_token: "abc123" }), { status: 200 })),
        );

      const [first, second] = await Promise.all([
        authStore.getCsrfToken(mockFetch),
        authStore.getCsrfToken(mockFetch),
      ]);
      const third = await authStore.getCsrfToken(mockFetch);

      expect([first, second, third]).toEqual(["abc123", "abc123", "abc123"]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0] as string).toContain("/api/classic/csrf_token");
    });

    it("refetches after the token is cleared", async () => {
      const mockFetch = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(JSON.stringify({ csrf_token: "old" }), { status: 200 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ csrf_token: "new" }), { status: 200 }),
        );

      expect(await authStore.getCsrfToken(mockFetch)).toBe("old");
      authStore.clearCsrfToken();
      expect(await authStore.getCsrfToken(mockFetch)).toBe("new");
    });

    it("does not cache a failed request", async () => {
      const mockFetch = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response("", { status: 500 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ csrf_token: "ok" }), { status: 200 }));

      await expect(authStore.getCsrfToken(mockFetch)).rejects.toThrow();
      expect(await authStore.getCsrfToken(mockFetch)).toBe("ok");
    });
  });

  it("should redirect to /oauth/login with return_to", () => {
    const mockWindow = {
      location: {
        origin: "http://localhost:3000",
        pathname: "/tournaments/1",
        href: "",
      },
    };
    vi.stubGlobal("window", mockWindow);

    authStore.redirectToLogin();

    expect(mockWindow.location.href).toBe(
      "/oauth/login?return_to=http%3A%2F%2Flocalhost%3A3000%2Ftournaments%2F1",
    );

    vi.unstubAllGlobals();
  });
});
