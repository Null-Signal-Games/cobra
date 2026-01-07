<script lang="ts">
  import { getContext, onMount } from "svelte";
  import {
    type Pairing,
    type PairingsContext,
    type Player,
    type Round,
    type Stage,
    Tournament,
  } from "./PairingsData";
  import {
    type ScoreReport,
    readableReportScore,
    reportsMatch,
  } from "./SelfReport";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import SelfReportOptions from "./SelfReportOptions.svelte";
  import ModalDialog from "../widgets/ModalDialog.svelte";
  import PlayerDisplay from "./PlayerDisplay.svelte";
  import { redirectRequest } from "../utils/network";
  import AdminReportOptions from "./AdminReportOptions.svelte";

  let {
    tournament,
    stage,
    round,
    pairing,
    deleteCallback,
  }: {
    tournament: Tournament;
    stage: Stage;
    round: Round;
    pairing: Pairing;
    deleteCallback?: (pairingId: number) => void;
  } = $props();

  const pairingsContext: PairingsContext = getContext("pairingsContext");

  let leftPlayer = $state(pairing.player1);
  let rightPlayer = $state(pairing.player2);
  if (pairing.player2.side == "corp" && stage.is_single_sided) {
    leftPlayer = pairing.player2;
    rightPlayer = pairing.player1;
  }
  let leftPlayerReport: ScoreReport | undefined = $state();
  let rightPlayerReport: ScoreReport | undefined = $state();
  let playersReported = $state(false);
  let selfReportsMatch = $state(false);

  onMount(() => {
    leftPlayerReport = pairing.self_reports?.find(
      (r) => r.report_player_id === leftPlayer.user_id,
    );
    rightPlayerReport = pairing.self_reports?.find(
      (r) => r.report_player_id === rightPlayer.user_id,
    );
    playersReported =
      leftPlayerReport !== undefined && rightPlayerReport !== undefined;
    selfReportsMatch =
      leftPlayerReport?.score1 === rightPlayerReport?.score1 &&
      leftPlayerReport?.score2 === rightPlayerReport?.score2 &&
      leftPlayerReport?.score1_corp === rightPlayerReport?.score1_corp &&
      leftPlayerReport?.score2_corp === rightPlayerReport?.score2_corp &&
      leftPlayerReport?.score1_runner === rightPlayerReport?.score1_runner &&
      leftPlayerReport?.score2_runner === rightPlayerReport?.score2_runner;
  });

  function changePlayerSide(player: Player, side: string) {
    if (
      !confirm(`Are you sure you want to switch ${player.name} to ${side}?`)
    ) {
      return;
    }

    let sideValue = side;
    if (player !== pairing.player1) {
      sideValue = side === "corp" ? "runner" : "corp";
    }

    void redirectRequest(
      `/beta/tournaments/${tournament.id}/rounds/${round.id}/pairings/${pairing.id}/report`,
      "POST",
      { side: `player1_is_${sideValue}` },
    );
  }

  function submitScore(score: ScoreReport) {
    void redirectRequest(
      `/beta/tournaments/${tournament.id}/rounds/${round.id}/pairings/${pairing.id}/report`,
      "POST",
      score,
    );
  }

  function resetReports() {
    if (!confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    void redirectRequest(
      `/beta/tournaments/${tournament.id}/rounds/${round.id}/pairings/${pairing.id}/reset_self_report`,
      "DELETE",
    );
  }
</script>

<div
  class="row m-1 round_pairing align-items-center table_{pairing.table_number} {pairing
    .ui_metadata.row_highlighted
    ? 'current_user_row'
    : ''}"
>
  <!-- Table label -->
  <div
    class="col-sm-2 {pairing.ui_metadata.row_highlighted
      ? 'font-weight-bold'
      : ''}"
  >
    {pairing.table_label}

    {#if pairingsContext.showOrganizerView && tournament.allow_streaming_opt_out}
      {#if pairing.player1.include_in_stream && pairing.player2.include_in_stream}
        <span title="May be included in video coverage.">
          <FontAwesomeIcon icon="video-camera" cssClass="text-success" />
        </span>
      {:else if stage.is_elimination}
        <span
          title="One or both players request not to be included in video coverage, but were informed this may not be possible in the cut."
        >
          <FontAwesomeIcon icon="video-camera" cssClass="text-warning" />
        </span>
      {:else}
        <span
          title="One or both players request not to not be included in video coverage."
        >
          <FontAwesomeIcon icon="video-camera" cssClass="text-secondary" />
          <FontAwesomeIcon icon="ban" cssClass="text-danger" />
        </span>
      {/if}
    {/if}
  </div>

  <!-- Player 1 -->
  {#if stage.view_decks}
    {#if pairingsContext.showOrganizerView}
      {#if stage.is_single_sided}
        <a
          href="/tournaments/{tournament.id}/rounds/{round.id}/pairings/{pairing.id}/view_decks?back_to=rounds"
        >
          <FontAwesomeIcon icon="eye" /> View decks
        </a>
      {/if}
    {:else if pairing.player1.side}
      <a
        href="/tournaments/{tournament.id}/rounds/{round.id}/pairings/{pairing.id}/view_decks?back_to=pairings"
      >
        <FontAwesomeIcon icon="eye" /> View decks
      </a>
    {:else}
      <a href="../players/{pairing.player1.id}/view_decks?back_to=pairings">
        <FontAwesomeIcon icon="eye" /> View decks
      </a>
    {/if}
  {/if}
  <PlayerDisplay
    player={leftPlayer}
    {pairing}
    left_or_right="left"
    is_single_sided={stage.is_single_sided}
    {changePlayerSide}
  />

  <!-- Score -->
  {#if pairingsContext.showOrganizerView && (!stage.is_single_sided || pairing.player1.side)}
    <AdminReportOptions {stage} {pairing} {submitScore} />
  {:else}
    <!-- Player view -->
    <div class="col-sm-2 centre_score">
      {pairing.score_label}
      {#if pairing.intentional_draw}
        <span class="badge badge-pill badge-secondary score-badge">ID</span>
      {/if}
      {#if pairing.two_for_one}
        <span class="badge badge-pill badge-secondary score-badge">2 for 1</span
        >
      {/if}
    </div>
  {/if}

  <!-- Player 2 -->
  <PlayerDisplay
    player={rightPlayer}
    {pairing}
    left_or_right="right"
    is_single_sided={stage.is_single_sided}
    {changePlayerSide}
  />
  {#if !pairingsContext.showOrganizerView && stage.view_decks && !pairing.player1.side && pairing.player2.id}
    <a href="../players/{pairing.player2.id}/view_decks?back_to=pairings">
      <FontAwesomeIcon icon="eye" /> View decks
    </a>
  {/if}

  <!-- Self-reporting -->
  {#if pairingsContext.showOrganizerView}
    <div class="row-sm1 mr-3">
      <button
        type="button"
        class="btn btn-primary mr-2"
        data-toggle="modal"
        data-target="#reports{pairing.id}"
      >
        Reports
        {#if !pairing.reported && pairing.self_reports?.length == 2 && reportsMatch(pairing.self_reports[0], pairing.self_reports[1])}
          <FontAwesomeIcon icon="exclamation-triangle" />
        {/if}
      </button>
      <button
        class="btn btn-danger"
        onclick={() => {
          deleteCallback?.(pairing.id);
        }}
        aria-label="delete"
      >
        <FontAwesomeIcon icon="trash" />
      </button>
    </div>
  {:else}
    <div class="col-sm-2">
      {#if pairing.policy.self_report}
        <SelfReportOptions
          tournamentId={tournament.id}
          {stage}
          {round}
          {pairing}
        />
      {/if}
      {#if pairing.self_reports && pairing.self_reports.length !== 0}
        Report: {pairing.self_reports[0].label}
      {/if}
    </div>
  {/if}

  {#snippet playerReport(player: Player, report: ScoreReport | undefined)}
    {player.name} reported:
    {#if report}
      {readableReportScore(report, pairing.player1.side, stage.is_single_sided)}
      {#if playersReported && !selfReportsMatch}
        <FontAwesomeIcon icon="times" />
      {/if}
    {:else}
      <FontAwesomeIcon icon="hourglass" />
    {/if}
  {/snippet}

  {#snippet acceptPlayerReportButton(player: Player, report: ScoreReport)}
    <button
      type="button"
      class="btn btn-primary"
      onclick={() => {
        submitScore(report);
      }}
      disabled={pairing.reported}
    >
      <FontAwesomeIcon icon="check" /> Accept {player.name}
    </button>
  {/snippet}

  <ModalDialog id="reports{pairing.id}" headerText="Player Self Reports">
    <p>
      <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
      {@render playerReport(leftPlayer, leftPlayerReport)}
    </p>
    <p>
      <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
      {@render playerReport(rightPlayer, rightPlayerReport)}
    </p>

    {#snippet footer()}
      {#if leftPlayerReport}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render acceptPlayerReportButton(leftPlayer, leftPlayerReport)}
      {/if}
      {#if rightPlayerReport}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render acceptPlayerReportButton(rightPlayer, rightPlayerReport)}
      {/if}
      {#if playersReported && !selfReportsMatch}
        <button
          type="button"
          class="btn btn-primary"
          onclick={resetReports}
          title="Reset self reports of pairing"
        >
          <FontAwesomeIcon icon="undo" /> Reset
        </button>
      {/if}
    {/snippet}
  </ModalDialog>
</div>
