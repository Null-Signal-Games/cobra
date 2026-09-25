import { COBRA_API_SERVER } from "$app/env/public";

export interface AuthUser {
  id: number;
  nrdb_id: number;
  nrdb_username: string;
}

interface JsonApiUserResponse {
  data: {
    id: string | number;
    attributes: {
      nrdb_id: number;
      nrdb_username: string;
    };
  };
}

const serverOrigin = (COBRA_API_SERVER || "").replace(/\/$/, "");

class AuthStore {
  user = $state<AuthUser | null>(null);
  isLoading = $state<boolean>(true);

  get isAuthenticated(): boolean {
    return this.user !== null;
  }

  async checkAuth(altFetch = fetch): Promise<AuthUser | null> {
    if (this.isAuthenticated) {
      return this.user;
    }

    this.isLoading = true;
    try {
      const response = await altFetch(`${serverOrigin}/api/v1/private/user`, {
        credentials: "include",
        headers: {
          Accept: "application/vnd.api+json",
        },
      });

      if (response.ok) {
        const json = (await response.json()) as JsonApiUserResponse;
        this.user = {
          id: Number(json.data.id),
          nrdb_id: json.data.attributes.nrdb_id,
          nrdb_username: json.data.attributes.nrdb_username,
        };
      } else {
        this.user = null;
      }
    } catch {
      this.user = null;
    } finally {
      this.isLoading = false;
    }

    return this.user;
  }

  redirectToLogin(returnTo?: string) {
    if (typeof window !== "undefined") {
      const defaultReturn = window.location.origin + window.location.pathname;
      const targetPath = returnTo ?? defaultReturn;
      const fullReturnUrl = targetPath.startsWith("http")
        ? targetPath
        : window.location.origin + targetPath;

      window.location.href = `${serverOrigin}/login?return_to=${encodeURIComponent(fullReturnUrl)}`;
    }
  }

  invalidateAndLogIn(returnTo?: string) {
    this.user = null;
    this.redirectToLogin(returnTo);
  }
}

export const authStore = new AuthStore();
