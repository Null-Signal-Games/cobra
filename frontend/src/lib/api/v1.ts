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
  const query = [
    "/api/v1/public/tournaments?page[size]=10",
    "include=tournament_type",
    "sort=-date,name",
  ];

  if (tournamentTypeId && tournamentTypeId.length > 0) {
    query.push(`filter[tournament_type_id]=${encodeURIComponent(tournamentTypeId)}`);
  }

  return query.join("&");
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

export async function loadTournamentBySlug(
  slug: string,
  altFetch = fetch,
): Promise<TournamentsResponse> {
  const res = await api.get<TournamentsResponse>(
    `/api/v1/public/tournaments?filter[slug]=${encodeURIComponent(slug)}`,
    {
      altFetch,
      headers: JSON_API_HEADERS,
    },
  );

  if (!res.ok) {
    globalMessages.errors.push(`Failed to load tournaments: ${res.error.message}`);
    return { data: [] };
  }

  return res.data;
}

export async function loadTournamentTypes(altFetch = fetch): Promise<TournamentTypeInfo[]> {
  const res = await api.get<TournamentTypesResponse>("/api/v1/public/tournament_types", {
    altFetch,
    headers: JSON_API_HEADERS,
  });

  return res.ok ? res.data.data : [];
}
