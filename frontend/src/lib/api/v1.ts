import { api as defaultApi, type ApiBase } from "$lib/api/apiBase";
import type {
  CurrentUserResponse,
  IdentitiesResponse,
  IdentityInfo,
  TournamentsResponse,
  TournamentTypeInfo,
  TournamentTypesResponse,
} from "$lib/api/v1ApiTypes";
import type { IdentityNames } from "$lib/model/Identity";
import { v1Adapter } from "$lib/model/v1Adapter";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

const JSON_API_HEADERS = {
  Accept: "application/vnd.api+json",
};

export class V1Api {
  constructor(private api: ApiBase = defaultApi) {}

  tournamentsApiUrl(tournamentTypeId?: string): string {
    const params = new URLSearchParams({
      "page[size]": "10",
      include: "tournament_type",
      sort: "-date,name",
    });

    if (tournamentTypeId) {
      params.set("filter[tournament_type_id]", tournamentTypeId);
    }

    return `/api/v1/public/tournaments?${params.toString()}`;
  }

  async loadTournaments(
    url = this.tournamentsApiUrl(),
    altFetch = fetch,
  ): Promise<TournamentsResponse> {
    const res = await this.api.get<TournamentsResponse>(url, {
      altFetch,
      headers: JSON_API_HEADERS,
    });

    if (!res.ok) {
      globalMessages.errors.push(`Failed to load tournaments: ${res.error.message}`);
      return { data: [] };
    }

    return res.data;
  }

  loadTournamentBySlug(
    slug: string,
    altFetch = fetch,
  ): Promise<TournamentsResponse> {
    const params = new URLSearchParams({
      "filter[slug]": slug,
    });

    return this.loadTournaments(
      `/api/v1/public/tournaments?${params.toString()}`,
      altFetch,
    );
  }

  async loadTournamentTypes(altFetch = fetch): Promise<TournamentTypeInfo[]> {
    const res = await this.api.get<TournamentTypesResponse>("/api/v1/public/tournament_types", {
      altFetch,
      headers: JSON_API_HEADERS,
    });

    if (!res.ok) {
      globalMessages.errors.push(`Failed to load tournament types: ${res.error.message}`);
      return [];
    }

    return res.data.data;
  }

  async loadUserTournaments(altFetch = fetch): Promise<TournamentsResponse> {
    const res = await this.api.get<TournamentsResponse>("/api/v1/private/user/tournaments", {
      altFetch,
      headers: JSON_API_HEADERS,
    });

    if (!res.ok) {
      globalMessages.errors.push(`Failed to load user tournaments: ${res.error.message}`);
      return { data: [] };
    }

    return res.data;
  }

  async loadCurrentUser(altFetch = fetch): Promise<CurrentUserResponse | null> {
    const res = await this.api.get<CurrentUserResponse>("/api/v1/private/user", {
      altFetch,
      headers: JSON_API_HEADERS,
    });

    if (!res.ok) {
      return null;
    }

    return res.data;
  }

  async loadIdentities(altFetch = fetch): Promise<IdentityInfo[]> {
    const res = await this.api.get<IdentitiesResponse>("/api/v1/public/identities", {
      altFetch,
      headers: JSON_API_HEADERS,
    });

    if (!res.ok) {
      globalMessages.errors.push(`Failed to load identities: ${res.error.message}`);
      return [];
    }

    return res.data.data;
  }

  async loadIdentityNames(altFetch = fetch): Promise<IdentityNames> {
    const identities = await this.loadIdentities(altFetch);
    return v1Adapter.adaptIdentityNames(identities);
  }
}

export const v1Api = new V1Api();
