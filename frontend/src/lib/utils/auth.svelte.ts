import { CLIENT_COBRA_API_ENDPOINT } from "$app/env/public";
import { v1Api } from "$lib/api/v1";

export interface AuthUser {
  id: number;
  nrdb_id: number;
  nrdb_username: string;
}

const serverOrigin = (CLIENT_COBRA_API_ENDPOINT || "").replace(/\/$/, "");

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
      const response = await v1Api.loadCurrentUser(altFetch);

      if (response) {
        this.user = {
          id: Number(response.data.id),
          nrdb_id: response.data.attributes.nrdb_id,
          nrdb_username: response.data.attributes.nrdb_username,
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

      window.location.href = `${serverOrigin}/oauth/login?return_to=${encodeURIComponent(fullReturnUrl)}`;
    }
  }

  invalidateAndLogIn(returnTo?: string) {
    this.user = null;
    this.redirectToLogin(returnTo);
  }
}

export const authStore = new AuthStore();
