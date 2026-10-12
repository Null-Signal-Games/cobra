import { describe, it, expect, vi, beforeEach } from "vitest";
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
