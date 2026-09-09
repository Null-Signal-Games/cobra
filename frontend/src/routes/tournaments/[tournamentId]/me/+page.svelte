<script lang="ts">
  import type { PageProps } from "./$types";
  import { invalidateAll } from "$app/navigation";
  import type { Pairing } from "$lib/model/Pairing";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import PlayerDisplay from "$lib/components/PlayerDisplay.svelte";
  import SelfReportOptions from "$lib/components/SelfReportOptions.svelte";
  import { reportScore } from "../api_helper";
  import type { ScoreReport } from "$lib/model/ScoreReport";
  import Identity from "$lib/components/identity/Identity.svelte";
  import {
    CreateMyTournamentSummary,
    type MyTournamentPairing,
  } from "$lib/utils/transformations";

  let { data }: PageProps = $props();

  let tournament = $derived(data.tournamentData.tournament);
  let tournamentId = $derived(tournament.id);
  let userId = $derived(data.user?.id);
  let pairings = $derived(data.pairings);

  let showPreviousRounds = $state(false);

  let numPairings = $derived(
    pairings
      ? pairings.stages.reduce(
          (acc, s) =>
            acc + s.rounds.reduce((acc, r) => acc + r.pairings.length, 0),
          0,
        )
      : 0,
  );

  let me = $derived(CreateMyTournamentSummary(pairings, userId));

  function isLatestRound(myPairing: MyTournamentPairing): boolean {
    if (!pairings || pairings.stages.length === 0) return false;
    const latestStage = pairings.stages[pairings.stages.length - 1];
    if (!latestStage || latestStage.rounds.length === 0) return false;
    const latestRound = latestStage.rounds[latestStage.rounds.length - 1];
    return (
      myPairing.stage.id === latestStage.id &&
      myPairing.round.id === latestRound.id
    );
  }

  function isBye(pairing: Pairing): boolean {
    return pairing.player1.id === 0 || pairing.player2.id === 0;
  }

  function iWon(pairing: Pairing): boolean {
    if (isBye(pairing) || !pairing.reported) return false;
    const isMe1 = pairing.player1.user_id === userId;
    const myScore = isMe1 ? pairing.score1 : pairing.score2;
    const oppScore = isMe1 ? pairing.score2 : pairing.score1;
    return myScore > oppScore;
  }

  function opponentWon(pairing: Pairing): boolean {
    if (isBye(pairing) || !pairing.reported) return false;
    const isMe1 = pairing.player1.user_id === userId;
    const myScore = isMe1 ? pairing.score1 : pairing.score2;
    const oppScore = isMe1 ? pairing.score2 : pairing.score1;
    return oppScore > myScore;
  }

  function getScoreResultStyle(pairing: Pairing): string {
    if (pairing.score_label.trim() === "" || pairing.score_label.trim() === "-") {
      return "";
    }
    if (isBye(pairing) || iWon(pairing)) {
      return "background-color: limegreen; color: black;";
    }
    if (opponentWon(pairing)) {
      return "background-color: orangered; color: black;";
    }
    return "background-color: lightgrey; color: black;";
  }

  async function reportScoreCallback(
    roundId: number,
    pairingId: number,
    report: ScoreReport,
    selfReport: boolean,
  ) {
    const success = await reportScore(
      tournamentId,
      roundId,
      pairingId,
      report,
      selfReport,
      data.tournamentData?.csrf_token,
    );
    if (!success) {
      return;
    }

    await invalidateAll();
  }
</script>

<div class="col-12">
{#if !data.player}
  <div class="alert alert-warning">
    <FontAwesomeIcon icon="exclamation-triangle" />
    You are not registered as a player in this tournament.
  </div>
{:else}
    {#if data}
    <div class="container">
        {#if numPairings > 0}
        <div class="row mb-3 align-items-center">
            <div class="col-12 col-md-4 d-flex flex-column justify-content-center text-center mt-3 mt-md-0">
            <h2>Corp</h2>
            {#if me.corpIdentity}
                <div class="text-muted mb-2"><Identity identity={me.corpIdentity} /></div>
            {/if}
            <h4 class="text-bold">{me.corp.wins} - {me.corp.losses} - {me.corp.ties}</h4>
            </div>

            <div class="col-12 col-md-4 d-flex flex-column justify-content-center text-center mt-3 mt-md-0">
            <h4>Total Points</h4>
            <h1>{me.total.points}</h1>
            <h4 class="text-bold">{me.total.wins} - {me.total.losses} - {me.total.ties}</h4>
            </div>

            <div class="col-12 col-md-4 d-flex flex-column justify-content-center text-center mt-3 mt-md-0">
            <h2>Runner</h2>
            {#if me.runnerIdentity}
                <div class="text-muted mb-2"><Identity identity={me.runnerIdentity} /></div>
            {/if}
            <h4 class="text-bold">{me.runner.wins} - {me.runner.losses} - {me.runner.ties}</h4>
            </div>
        </div>
        {/if}

        {#if numPairings === 0}
        <div class="row">
            <div class="col-12">
            <div class="alert alert-info">
                <FontAwesomeIcon icon="info-circle" />
                You don't have any pairings in this tournament yet.
            </div>
            </div>
        </div>
        {:else}
        {#if numPairings > 1}
            <div class="row">
            <div class="col-12">
                <button
                class="btn btn-link btn-sm p-0 mb-2 d-flex align-items-center small"
                onclick={() => (showPreviousRounds = !showPreviousRounds)}
                >
                <FontAwesomeIcon
                    icon={showPreviousRounds ? "chevron-down" : "chevron-right"}
                />
                <span class="ml-2">
                    {showPreviousRounds ? "Hide" : "Show"} previous rounds
                </span>
                </button>
            </div>
            </div>
        {/if}

        <div class="row col-12 table-responsive">
            <table id="rounds_table" class="table">
            <thead>
                <tr>
                <th>Round</th>
                <th>Table</th>
                {#if tournament.swiss_format === "single_sided"}
                    <th>Side</th>
                {/if}
                <th>Opponent</th>
                <th class="text-center">Result</th>
                <th class="text-center">Points</th>
                </tr>
            </thead>
            <tbody>
                {#each me.pairings as myPairing (myPairing.id)}
                {#if showPreviousRounds || isLatestRound(myPairing)}
                    <tr>
                    <td>
                        {myPairing.stage.is_elimination ? "Cut " : ""}{myPairing.round.number}
                    </td>
                    <td>{isBye(myPairing) ? "" : myPairing.table_number}</td>
                    {#if myPairing.stage.is_single_sided}
                        <td class={iWon(myPairing) ? "font-weight-bold" : ""}>
                        {#if !isBye(myPairing)}
                            <PlayerDisplay
                            player={myPairing.player1.user_id === userId
                                ? myPairing.player1
                                : myPairing.player2}
                            pairing={myPairing}
                            left_or_right="left"
                            is_single_sided={myPairing.stage.is_single_sided}
                            />
                        {/if}
                        </td>
                    {/if}
                    <td class={opponentWon(myPairing) ? "font-weight-bold" : ""}>
                        {#if isBye(myPairing)}
                        (Bye)
                        {:else}
                        <PlayerDisplay
                            player={myPairing.player1.user_id === userId
                            ? myPairing.player2
                            : myPairing.player1}
                            pairing={myPairing}
                            left_or_right="left"
                            is_single_sided={myPairing.stage.is_single_sided}
                        />
                        {/if}
                    </td>
                    <td class="text-center align-middle" style={getScoreResultStyle(myPairing)}>
                        {#if myPairing.score_label.trim() !== "" && myPairing.score_label.trim() !== "-"}
                        <div class="h4 mb-0 font-weight-bold">
                            {#if isBye(myPairing) || iWon(myPairing)}
                            W
                            {:else if opponentWon(myPairing)}
                            L
                            {:else}
                            T
                            {/if}
                        </div>
                        {#if myPairing.intentional_draw}
                            <span
                            class="badge badge-pill badge-secondary score-badge"
                            >
                            ID
                            </span>
                        {/if}
                        {#if myPairing.two_for_one}
                            <span
                            class="badge badge-pill badge-secondary score-badge"
                            >
                            2 for 1
                            </span>
                        {/if}
                        {:else}
                        {#if myPairing.policy.self_report}
                            <SelfReportOptions
                            stage={myPairing.stage}
                            pairing={myPairing}
                            reportScoreCallback={async (
                                pairingId: number,
                                report: ScoreReport,
                                selfReport: boolean,
                            ) => {
                                await reportScoreCallback(
                                myPairing.round.id,
                                pairingId,
                                report,
                                selfReport,
                                );
                            }}
                            />
                        {/if}
                        {#if myPairing.self_reports && myPairing.self_reports.length !== 0}
                            Report: {myPairing.self_reports[0].label}
                        {/if}
                        {/if}
                    </td>
                    <td class="text-center align-middle">
                        {#if myPairing.cumulativePoints !== null}
                        {myPairing.cumulativePoints}
                        {/if}
                    </td>
                    </tr>
                {/if}
                {/each}
            </tbody>
            </table>
        </div>
        {/if}
    </div>
    {:else}
    <div class="d-flex align-items-center m-2">
        <div class="spinner-border m-auto"></div>
    </div>
    {/if}

{/if}
</div>
