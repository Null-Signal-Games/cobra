<script lang="ts">
  import AdminReportOptions from "./AdminReportOptions.svelte";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import ModalDialog from "$lib/components/ModalDialog.svelte";
  import type { Stage } from "$lib/model/Stage";
  import type { Round } from "$lib/model/Round";
  import type { Pairing } from "$lib/model/Pairing";
  import type { Tournament } from "$lib/model/Tournament";
  import { readableReportScore, reportsMatch, type ScoreReport } from "$lib/model/ScoreReport";
  import PlayerDisplay from "$lib/components/PlayerDisplay.svelte";
  import type { Player } from "$lib/model/Player";
  import { resolve } from "$app/paths";

  let {
    tournament,
    stage,
    round,
    pairing,
    deleteCallback,
    changePlayerSideCallback,
    reportScoreCallback,
    resetReportsCallback,
  }: {
    tournament: Tournament;
    stage: Stage;
    round: Round;
    pairing: Pairing;
    deleteCallback?: (pairingId: number) => void;
    changePlayerSideCallback?: (pairingId: number, side: string) => void;
    reportScoreCallback?: (
      pairingId: number,
      report: ScoreReport,
      selfReport: boolean,
    ) => void;
    resetReportsCallback?: (pairingId: number) => void;
  } = $props();

  let leftPlayer = $derived(
    stage.is_single_sided && pairing.player2.side == "corp"
      ? pairing.player2
      : pairing.player1,
  );
  let rightPlayer = $derived(
    stage.is_single_sided && pairing.player2.side == "corp"
      ? pairing.player1
      : pairing.player2,
  );
  let leftPlayerReport = $derived(
    pairing.self_reports?.find(
      (r) => r.report_player_id === leftPlayer.user_id,
    ),
  );
  let rightPlayerReport = $derived(
    pairing.self_reports?.find(
      (r) => r.report_player_id === rightPlayer.user_id,
    ),
  );
  let playersReported = $derived(
    leftPlayerReport !== undefined && rightPlayerReport !== undefined,
  );
  let selfReportsMatch = $derived(
    leftPlayerReport?.score1 === rightPlayerReport?.score1 &&
      leftPlayerReport?.score2 === rightPlayerReport?.score2 &&
      leftPlayerReport?.score1_corp === rightPlayerReport?.score1_corp &&
      leftPlayerReport?.score2_corp === rightPlayerReport?.score2_corp &&
      leftPlayerReport?.score1_runner === rightPlayerReport?.score1_runner &&
      leftPlayerReport?.score2_runner === rightPlayerReport?.score2_runner,
  );

  function changePlayerSide(player: Player, side: string) {
    if (
      !changePlayerSideCallback ||
      !confirm(`Are you sure you want to switch ${player.name} to ${side}?`)
    ) {
      return;
    }

    let adjSide = side;
    if (player !== pairing.player1) {
      adjSide = side === "corp" ? "runner" : "corp";
    }

    changePlayerSideCallback(pairing.id, adjSide);
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

    {#if tournament.allow_streaming_opt_out}
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
    {#if stage.is_single_sided}
      <a
        href={resolve(`/tournaments/${tournament.id}/rounds/${round.id}/pairings/${pairing.id}/view_decks?back_to=rounds`)}
      >
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
    show_ids={!stage.is_single_sided || pairing.player1.side !== null}
  />

  <!-- Score -->
  <AdminReportOptions {stage} {pairing} {reportScoreCallback} />

  <!-- Player 2 -->
  <PlayerDisplay
    player={rightPlayer}
    {pairing}
    left_or_right="right"
    is_single_sided={stage.is_single_sided}
    {changePlayerSide}
    show_ids={!stage.is_single_sided || pairing.player2.side !== null}
  />

  <!-- Score reporting -->
  <div class="row-sm1 mr-3">
    <button
      type="button"
      class="btn btn-primary mr-2"
      data-toggle="modal"
      data-target="#reports{pairing.id}"
    >
      Reports
      {#if !pairing.reported && pairing.self_reports?.length == 2 && !reportsMatch(pairing.self_reports[0], pairing.self_reports[1])}
        <FontAwesomeIcon
          icon="exclamation-triangle"
          dataTestId="reportConflict"
        />
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
      data-dismiss="modal"
      onclick={() => {
        reportScoreCallback?.(pairing.id, report, false);
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
          onclick={() => {
            resetReportsCallback?.(pairing.id);
          }}
          title="Reset self reports of pairing"
        >
          <FontAwesomeIcon icon="undo" /> Reset
        </button>
      {/if}
    {/snippet}
  </ModalDialog>
</div>
