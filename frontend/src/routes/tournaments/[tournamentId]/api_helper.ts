import { COBRA_API_SERVER } from "$app/env/public";
import type { NewPairing } from "$lib/model/Pairing";
import type { Round } from "$lib/model/Round";
import type { Stage } from "$lib/model/Stage";
import { Tournament, TournamentPolicies } from "$lib/model/Tournament";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

const apiServer = (COBRA_API_SERVER || "").replace(/\/$/, "");

// TODO(plural): move this to its own library
export function csrfToken() {
  return typeof document !== "undefined"
    ? (document
        .querySelector("meta[name='csrf-token']")
        ?.getAttribute("content") ?? "")
    : "";
}

export class PairingsData {
  policy = new TournamentPolicies();
  stages: Stage[] = [];
  warnings?: string[] = [];
}

export interface RoundData {
  tournament: Tournament;
  stage: Stage;
  round: Round;
  policy?: TournamentPolicies;
  warnings?: string[];
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

export async function createStage(
  csrfToken: string,
  tournamentId: number,
  cutSingleElim?: boolean,
  cutCount?: number,
) {
  const isCut = cutSingleElim !== undefined && cutCount !== undefined;
  const path = isCut
    ? `${apiServer}/beta/tournaments/${tournamentId}/cut`
    : `${apiServer}/beta/tournaments/${tournamentId}/stages`;
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
    `${apiServer}/beta/tournaments/${tournamentId}/rounds`,
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

export async function setRegistrationStatus(
  csrfToken: string,
  tournamentId: number,
  open: boolean,
): Promise<boolean> {
  const path = open
    ? `${apiServer}/beta/tournaments/${tournamentId}/open_registration`
    : `${apiServer}/beta/tournaments/${tournamentId}/close_registration`;

  const response = await fetch(path, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
    },
  });

  return response.status === 200;
}

export async function completeRound(
  tournamentId: number,
  roundId: number,
  completed: boolean,
): Promise<boolean> {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/complete`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      body: JSON.stringify({ completed: completed }),
    },
  );

  return response.status === 200;
}

export async function updateRoundTimer(
  csrfToken: string,
  tournamentId: number,
  roundId: number,
  length_minutes: number,
  operation: string,
): Promise<boolean> {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/update_timer`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({
        length_minutes: length_minutes,
        operation: operation,
      }),
    },
  );

  return response.status === 200;
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

export async function createPairing(
  tournamentId: number,
  roundId: number,
  newPairing: NewPairing,
): Promise<boolean> {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      body: JSON.stringify({ pairing: newPairing }),
    },
  );

  return response.status === 200;
}

export async function deletePairing(
  tournamentId: number,
  roundId: number,
  pairingId: number,
): Promise<boolean> {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
    },
  );

  return response.status === 200;
}

export async function deleteTournament(
  tournamentId: number,
  confirmationName: string,
  csrfOrFetch?: string | typeof fetch,
  altFetch = fetch,
): Promise<boolean> {
  const { token, customFetch } = resolveCsrfAndFetch(csrfOrFetch, altFetch);

  try {
    const response = await customFetch(`${apiServer}/beta/tournaments/${tournamentId}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": token,
      },
      body: JSON.stringify({ confirmation_name: confirmationName }),
    });

    if (!response.ok) {
      if (response.status === 422) {
        try {
          const errData = (await response.json()) as { error?: string };
          if (errData.error) {
            globalMessages.errors.push(errData.error);
            return false;
          }
        } catch {
          // ignore json parse error
        }
      }
      globalMessages.errors.push("Failed to delete tournament.");
      return false;
    }

    return true;
  } catch (e) {
    const err = e as Error;
    globalMessages.errors.push(`Failed to delete tournament: ${err.message}`);
    return false;
  }
}

export async function deleteStage(
  tournamentId: number,
  stageId: number,
  confirmationName: string,
  csrfOrFetch?: string | typeof fetch,
  altFetch = fetch,
): Promise<boolean> {
  const { token, customFetch } = resolveCsrfAndFetch(csrfOrFetch, altFetch);

  try {
    const response = await customFetch(
      `${apiServer}/beta/tournaments/${tournamentId}/stages/${stageId}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": token,
        },
        body: JSON.stringify({ confirmation_name: confirmationName }),
      },
    );

    if (!response.ok) {
      if (response.status === 422) {
        try {
          const errData = (await response.json()) as { error?: string };
          if (errData.error) {
            globalMessages.errors.push(errData.error);
            return false;
          }
        } catch {
          // ignore json parse error
        }
      }
      globalMessages.errors.push("Failed to delete stage.");
      return false;
    }

    return true;
  } catch (e) {
    const err = e as Error;
    globalMessages.errors.push(`Failed to delete stage: ${err.message}`);
    return false;
  }
}

export async function loadRound(
  tournamentId: number,
  roundId: number,
  altFetch = fetch,
): Promise<RoundData> {
  const response = await altFetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/round_data`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const data = (await response.json()) as RoundData;
  globalMessages.warnings = data.warnings ?? [];

  return data;
}

export async function rePairRound(
  tournamentId: number,
  roundId: number,
): Promise<boolean> {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/repair`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
    },
  );

  return response.status === 200;
}

export async function deleteRound(
  tournamentId: number,
  roundId: number,
): Promise<boolean> {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
    },
  );

  return response.status === 200;
}

export async function saveSOSWeighting(
  tournamentId: number,
  roundId: number,
  weight: number,
): Promise<boolean> {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      body: JSON.stringify({ weight: weight }),
    },
  );

  return response.status === 200;
}
