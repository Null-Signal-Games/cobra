import { api } from "$lib/api/apiBase";
import type {
  TournamentsResponse,
  TournamentTypeInfo,
  TournamentTypesResponse,
} from "$lib/api/v1ApiTypes";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

const JSON_API_HEADERS = {
  Accept: "application/vnd.api+json",
};

export function tournamentsApiUrl(tournamentTypeId?: string): string {
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

export async function loadTournaments(
  url = tournamentsApiUrl(),
  altFetch = fetch,
): Promise<TournamentsResponse> {
  const res = await api.get<TournamentsResponse>(url, {
    altFetch,
    headers: JSON_API_HEADERS,
  });

  if (!res.ok) {
    globalMessages.errors.push(`Failed to load tournaments: ${res.error.message}`);
    return { data: [] };
  }

  return res.data;
}

export function loadTournamentBySlug(
  slug: string,
  altFetch = fetch,
): Promise<TournamentsResponse> {
  const params = new URLSearchParams({
    "filter[slug]": slug,
  });

  return loadTournaments(
    `/api/v1/public/tournaments?${params.toString()}`,
    altFetch,
  );
}

export async function loadTournamentTypes(altFetch = fetch): Promise<TournamentTypeInfo[]> {
  const res = await api.get<TournamentTypesResponse>("/api/v1/public/tournament_types", {
    altFetch,
    headers: JSON_API_HEADERS,
  });

  if (!res.ok) {
    globalMessages.errors.push(`Failed to load tournament types: ${res.error.message}`);
    return [];
  }

  return res.data.data;
}
