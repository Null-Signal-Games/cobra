// Types and transformation code to transform data between the implicit API and data structures needed by varioius pages.

import type { Identity as IdentityType } from "$lib/model/Identity";
import type { PairingsData } from "../../routes/tournaments/[tournamentId]/api_helper";
import type { Pairing } from "$lib/model/Pairing";
import type { Round } from "$lib/model/Round";
import type { Stage } from "$lib/model/Stage";

export interface ScoreSummary {
  wins: number;
  losses: number;
  ties: number;
}

export type MyTournamentPairing = Pairing & {
  stage: Stage;
  round: Round;
  cumulativePoints: number | null;
};

export interface MyTournamentSummary {
  total: ScoreSummary & { points: number };
  corp: ScoreSummary;
  runner: ScoreSummary;
  corpIdentity: IdentityType | undefined;
  runnerIdentity: IdentityType | undefined;
  pairings: MyTournamentPairing[];
}

// Transform pairings data into a data structure to power the "Me" page for a tournament
export function CreateMyTournamentSummary(
  data: PairingsData | null | undefined,
  userId?: number | null,
): MyTournamentSummary {
  const result: MyTournamentSummary = {
    total: { wins: 0, losses: 0, ties: 0, points: 0 },
    corp: { wins: 0, losses: 0, ties: 0 },
    runner: { wins: 0, losses: 0, ties: 0 },
    corpIdentity: undefined,
    runnerIdentity: undefined,
    // pairings are sorted by stage # and round # and will indicate if they are elimination or swiss rounds.
    pairings: [],
  };
  if (!data || !userId) return result;

  let pts = 0;

  for (const stage of data.stages) {
    for (const round of stage.rounds) {
      for (const pairing of round.pairings) {
        const isMe1 = pairing.player1.user_id === userId;
        const isMe2 = pairing.player2.user_id === userId;

        if (!isMe1 && !isMe2) continue;

        if (!result.corpIdentity || !result.runnerIdentity) {
          const myPlayer = isMe1 ? pairing.player1 : pairing.player2;
          if (myPlayer.corp_id.name) result.corpIdentity = myPlayer.corp_id;
          if (myPlayer.runner_id.name) result.runnerIdentity = myPlayer.runner_id;
        }

        let cumulativePoints: number | null = null;
        const isBye = pairing.player1.id === 0 || pairing.player2.id === 0;

        if (!stage.is_elimination) {
          if (isBye) {
            pts += isMe1 ? pairing.score1 : pairing.score2;
            cumulativePoints = pts;
          } else if (pairing.reported) {
            pts += isMe1 ? pairing.score1 : pairing.score2;
            cumulativePoints = pts;
          }
        }

        result.pairings.push({
          ...pairing,
          stage,
          round,
          cumulativePoints
        });

        if (isBye) {
          result.total.wins += 1;
          result.total.points += isMe1 ? pairing.score1 : pairing.score2;
          continue;
        }

        if (!pairing.reported) continue;

        const myScore = isMe1 ? pairing.score1 : pairing.score2;
        const oppScore = isMe1 ? pairing.score2 : pairing.score1;

        result.total.points += myScore;

        if (myScore > oppScore) result.total.wins += 1;
        else if (myScore < oppScore) result.total.losses += 1;
        else result.total.ties += 1;

        let mySide = "";
        if (stage.is_single_sided) {
          mySide = isMe1 ? (pairing.player1.side ?? "") : (pairing.player2.side ?? "");
        }

        if (!stage.is_single_sided || mySide === "corp") {
          const myCorp = stage.is_single_sided ? myScore : (isMe1 ? pairing.score1_corp : pairing.score2_corp);
          const oppRunner = stage.is_single_sided ? oppScore : (isMe1 ? pairing.score2_runner : pairing.score1_runner);
          if (myCorp > oppRunner) result.corp.wins += 1;
          else if (myCorp < oppRunner) result.corp.losses += 1;
          else result.corp.ties += 1;
        }

        if (!stage.is_single_sided || mySide === "runner") {
          const myRunner = stage.is_single_sided ? myScore : (isMe1 ? pairing.score1_runner : pairing.score2_runner);
          const oppCorp = stage.is_single_sided ? oppScore : (isMe1 ? pairing.score2_corp : pairing.score1_corp);
          if (myRunner > oppCorp) result.runner.wins += 1;
          else if (myRunner < oppCorp) result.runner.losses += 1;
          else result.runner.ties += 1;
        }
      }
    }
  }
  return result;
}
