import { COBRA_API_SERVER } from "$app/env/public";
import type { ScoreReport } from "$lib/model/ScoreReport";
import type { Stage } from "$lib/model/Stage";
import type { Stats, CutStats } from "$lib/model/Stats";
import { TournamentPolicies } from "$lib/model/Tournament";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";
import { csrfToken } from "../api_helper";

const apiServer = (COBRA_API_SERVER || "").replace(/\/$/, "");

export class PairingsData {
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
    ? `${apiServer}/tournaments/${tournamentId}/rounds/pairings_data/${userId}`
    : `${apiServer}/beta/tournaments/${tournamentId}/rounds/pairings_data`;

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
    `${apiServer}/beta/tournaments/${tournamentId}/id_and_faction_data`,
    {
      method: "GET",
    },
  );

  return (await response.json()) as Stats;
}

export async function loadCutStats(tournamentId: number, altFetch = fetch): Promise<CutStats> {
  const response = await altFetch(
    `${apiServer}/beta/tournaments/${tournamentId}/cut_conversion_rates`,
    {
      method: "GET",
    },
  );

  return (await response.json()) as CutStats;
}

function resolveCsrfAndFetch(
  csrfOrFetch?: string | typeof fetch,
  altFetch: typeof fetch = fetch,
): { token: string; customFetch: typeof fetch } {
  let token = "";
  let customFetch = altFetch;

  if (typeof csrfOrFetch === "function") {
    customFetch = csrfOrFetch;
  } else if (typeof csrfOrFetch === "string") {
    token = csrfOrFetch;
  }

  if (!token) {
    token = csrfToken();
  }

  return { token, customFetch };
}

export async function changePlayerSide(
  tournamentId: number,
  roundId: number,
  pairingId: number,
  side: string,
  csrfOrFetch?: string | typeof fetch,
  altFetch = fetch,
): Promise<boolean> {
  const { token, customFetch } = resolveCsrfAndFetch(csrfOrFetch, altFetch);

  try {
    const response = await customFetch(
      `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}/report`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": token,
        },
        body: JSON.stringify({ side: `player1_is_${side}` }),
      },
    );

    if (!response.ok) {
      globalMessages.errors.push("Failed to change player side.");
      return false;
    }

    return true;
  } catch (e) {
    const err = e as Error;
    globalMessages.errors.push(`Failed to change player side: ${err.message}`);
    return false;
  }
}

export async function createStage(
  csrfToken: string,
  tournamentId: number,
  cutSingleElim?: boolean,
  cutCount?: number,
) {
  const isCut = cutSingleElim !== undefined && cutCount !== undefined;
  const path = isCut
    ? `${COBRA_API_SERVER}/beta/tournaments/${tournamentId}/cut`
    : `${COBRA_API_SERVER}/beta/tournaments/${tournamentId}/stages`;
  const body = isCut
    ? { number: cutCount, ...(cutSingleElim && { elimination_type: "single" }) }
    : null;

  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(body),
  });

  return response.status === 200;
}

export async function pairRound(csrfToken: string, tournamentId: number) {
  const response = await fetch(
    `${COBRA_API_SERVER}/beta/tournaments/${tournamentId}/rounds`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken
      },
    },
  );

  return response.status === 200;
}

export async function completeRound(
  csrfToken: string,
  tournamentId: number,
  roundId: number,
  completed: boolean,
): Promise<boolean> {
  const response = await fetch(
    `${COBRA_API_SERVER}/beta/tournaments/${tournamentId}/rounds/${roundId}/complete`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ completed: completed }),
    },
  );

  return response.status === 200;
}

export async function reportScore(
  tournamentId: number,
  roundId: number,
  pairingId: number,
  data: ScoreReport,
  selfReport: boolean,
  csrfOrFetch?: string | typeof fetch,
  altFetch = fetch,
): Promise<boolean> {
  // Remove UI-specific data to prevent parameter errors on the server
  const cleanData = { ...data };
  delete cleanData.label;
  delete cleanData.extra_self_report_label;

  const { token, customFetch } = resolveCsrfAndFetch(csrfOrFetch, altFetch);

  try {
    const response = await customFetch(
      `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}/report`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": token,
        },
        body: JSON.stringify({
          pairing: cleanData,
          self_report: selfReport,
        }),
      },
    );

    if (!response.ok) {
      globalMessages.errors.push("Failed to report score.");
      return false;
    }

    return true;
  } catch (e) {
    const err = e as Error;
    globalMessages.errors.push(`Failed to report score: ${err.message}`);
    return false;
  }
}

export async function resetReports(
  tournamentId: number,
  roundId: number,
  pairingId: number,
  csrfOrFetch?: string | typeof fetch,
  altFetch = fetch,
): Promise<boolean> {
  const { token, customFetch } = resolveCsrfAndFetch(csrfOrFetch, altFetch);

  try {
    const response = await customFetch(
      `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}/reset_self_report`,
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": token,
        },
      },
    );

    if (!response.ok) {
      globalMessages.errors.push("Failed to reset self report.");
      return false;
    }

    return true;
  } catch (e) {
    const err = e as Error;
    globalMessages.errors.push(`Failed to reset self report: ${err.message}`);
    return false;
  }
}
