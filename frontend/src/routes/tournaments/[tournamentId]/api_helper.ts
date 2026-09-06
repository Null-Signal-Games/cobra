import { COBRA_API_SERVER } from "$app/env/public";
import type { Stage } from "$lib/model/Stage";
import { TournamentPolicies } from "$lib/model/Tournament";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

class PairingsData {
  policy = new TournamentPolicies();
  stages: Stage[] = [];
  warnings?: string[] = [];
}

export async function loadPairings(
  tournamentId: number,
  userId: number | null = null,
  altFetch = fetch,
) {
  const url = userId
    ? `${COBRA_API_SERVER}/tournaments/${tournamentId}/rounds/pairings_data/${userId}`
    : `${COBRA_API_SERVER}/beta/tournaments/${tournamentId}/rounds/pairings_data`;

  const response = await altFetch(url, {
    method: "GET",
    credentials: "include",
  });

  const data = (await response.json()) as PairingsData;
  globalMessages.warnings = data.warnings ?? [];

  return data;
}
