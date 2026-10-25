import { CLIENT_COBRA_API_ENDPOINT } from "$app/env/public";
import { classicApi } from "$lib/api/classic";
import { v1Api } from "$lib/api/v1";

export interface AuthUser {
  id: number;
  nrdb_id: number;
  nrdb_username: string;
}

const serverOrigin = (CLIENT_COBRA_API_ENDPOINT || "").replace(/\/$/, "");

async function loadUser(altFetch: typeof fetch): Promise<AuthUser | null> {
  try {
    const response = await v1Api.loadCurrentUser(altFetch);
    if (!response) {
      return null;
    }

    return {
      id: Number(response.data.id),
      nrdb_id: response.data.attributes.nrdb_id,
      nrdb_username: response.data.attributes.nrdb_username,
    };
  } catch {
    return null;
  }
}

class AuthStore {
  user = $state<AuthUser | null>(null);
  isLoading = $state<boolean>(true);

  // Rails ties the CSRF token to the session cookie, so one token is valid for every
  // mutating request until the session changes.
  private csrfToken: string | null = null;
  private csrfTokenRequest: Promise<string> | null = null;

  get isAuthenticated(): boolean {
    return this.user !== null;
  }

  async checkAuth(altFetch = fetch): Promise<AuthUser | null> {
    // Never read or write this state on the server side.
    // Server-side code should get the current user from load data (see routes/+layout.ts).
    if (typeof window === "undefined") {
      return loadUser(altFetch);
    }

    if (this.isAuthenticated) {
      return this.user;
    }

    this.isLoading = true;
    try {
      this.user = await loadUser(altFetch);
    } finally {
      this.isLoading = false;
    }

    return this.user;
  }

  async getCsrfToken(altFetch = fetch): Promise<string> {
    // Only cache in the browser; on the server this store is shared across requests.
    if (typeof window === "undefined") {
      return classicApi.loadCsrfToken(altFetch);
    }

    if (this.csrfToken) {
      return this.csrfToken;
    }

    this.csrfTokenRequest ??= classicApi
      .loadCsrfToken(altFetch)
      .then((token) => {
        this.csrfToken = token;
        return token;
      })
      .finally(() => {
        this.csrfTokenRequest = null;
      });

    return this.csrfTokenRequest;
  }

  clearCsrfToken() {
    this.csrfToken = null;
  }

  redirectToLogin(returnTo?: string) {
    if (typeof window !== "undefined") {
      const defaultReturn = window.location.origin + window.location.pathname;
      const targetPath = returnTo ?? defaultReturn;
      const fullReturnUrl = targetPath.startsWith("http")
        ? targetPath
        : window.location.origin + targetPath;

      window.location.href = `${serverOrigin}/oauth/login?return_to=${encodeURIComponent(fullReturnUrl)}`;
    }
  }

  invalidateAndLogIn(returnTo?: string) {
    this.user = null;
    this.clearCsrfToken();
    this.redirectToLogin(returnTo);
  }
}

export const authStore = new AuthStore();
