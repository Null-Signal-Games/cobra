import { COBRA_API_SERVER } from "$app/env/public";
import type { Stage } from "$lib/model/Stage";
import type { Stats, CutStats } from "$lib/model/Stats";
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


export async function loadStats(tournamentId: number, altFetch = fetch): Promise<Stats> {
  const response = await altFetch(
    `${COBRA_API_SERVER}/beta/tournaments/${tournamentId}/id_and_faction_data`,
    {
      method: "GET",
    },
  );

  return (await response.json()) as Stats;
}

export async function loadCutStats(tournamentId: number, altFetch = fetch): Promise<CutStats> {
  const response = await altFetch(
    `${COBRA_API_SERVER}/beta/tournaments/${tournamentId}/cut_conversion_rates`,
    {
      method: "GET",
    },
  );

  return (await response.json()) as CutStats;
}
