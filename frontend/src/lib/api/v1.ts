import { api as defaultApi, type ApiBase } from "$lib/api/apiBase";
import type {
  CurrentUserResponse,
  IdentitiesResponse,
  IdentityInfo,
  PlayersResponse,
  TournamentResponse,
  TournamentsResponse,
  TournamentTypeInfo,
  TournamentTypesResponse,
} from "$lib/api/v1ApiTypes";
import type { IdentityNames } from "$lib/model/Identity";
import { Player } from "$lib/model/Player";
import type { Tournament } from "$lib/model/Tournament";
import { v1Adapter } from "$lib/model/v1Adapter";
import { addError } from "$lib/utils/GlobalMessageState.svelte";

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
      addError(`Failed to load tournaments: ${res.error.message}`);
      return { data: [] };
    }

    return res.data;
  }

  async loadTournament(
    tournamentId: number,
    altFetch = fetch,
  ): Promise<{ tournament: Tournament }> {
    const res = await this.api.getOrThrow<TournamentResponse>(
      `/api/v1/public/tournaments/${tournamentId}`,
      { altFetch, headers: JSON_API_HEADERS },
    );
    return { tournament: v1Adapter.adaptTournament(res.data) };
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
      addError(`Failed to load tournament types: ${res.error.message}`);
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
      addError(`Failed to load user tournaments: ${res.error.message}`);
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
      addError(`Failed to load identities: ${res.error.message}`);
      return [];
    }

    return res.data.data;
  }

  async loadIdentityNames(altFetch = fetch): Promise<IdentityNames> {
    const identities = await this.loadIdentities(altFetch);
    return v1Adapter.adaptIdentityNames(identities);
  }

  playersApiUrl(tournamentId: number, options?: { userId?: number }): string {
    const params = new URLSearchParams({
      include: "corp_identity,runner_identity",
    });

    if (options?.userId !== undefined) {
      params.set("filter[user_id]", String(options.userId));
    }

    return `/api/v1/public/tournaments/${tournamentId}/players?${params.toString()}`;
  }

  async loadPlayers(
    tournamentId: number,
    options?: { userId?: number },
    altFetch = fetch,
  ): Promise<PlayersResponse> {
    const url = this.playersApiUrl(tournamentId, options);
    const res = await this.api.get<PlayersResponse>(url, {
      altFetch,
      headers: JSON_API_HEADERS,
    });

    if (!res.ok) {
      addError(`Failed to load players: ${res.error.message}`);
      return { data: [] };
    }

    return res.data;
  }

  async loadPlayerByUserId(
    tournamentId: number,
    userId: number,
    altFetch = fetch,
  ): Promise<Player> {
    const res = await this.loadPlayers(tournamentId, { userId }, altFetch);
    if (res.data.length > 0) {
      return v1Adapter.adaptPlayer(res.data[0], res.included);
    }
    const player = new Player();
    player.user_id = userId;
    return player;
  }
}

export const v1Api = new V1Api();

