<script lang="ts">
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import SelfReportOptions from "$lib/components/SelfReportOptions.svelte";
  import type { Stage } from "$lib/model/Stage";
  import type { Round } from "$lib/model/Round";
  import { type Pairing } from "$lib/model/Pairing";
  import type { Tournament } from "$lib/model/Tournament";
  import { readableReportScore, type ScoreReport } from "$lib/model/ScoreReport";
  import PlayerDisplay from "$lib/components/PlayerDisplay.svelte";
  import { resolve } from "$app/paths";

  let {
    tournament,
    stage,
    round,
    pairing,
    reportScoreCallback,
  }: {
    tournament: Tournament;
    stage: Stage;
    round: Round;
    pairing: Pairing;
    reportScoreCallback?: (
      pairingId: number,
      report: ScoreReport,
      selfReport: boolean,
    ) => void;
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
  </div>

  <!-- Player 1 -->
  {#if stage.view_decks}
    {#if pairing.player1.side}
      <a
        href={resolve(`/tournaments/${tournament.id}/rounds/${round.id}/pairings/${pairing.id}/view_decks?back_to=pairings`)}
      >
        <FontAwesomeIcon icon="eye" /> View decks
      </a>
    {:else}
      <!-- TODO: Implement once players pages exist -->
      <!-- <a href={resolve(`/players/${pairing.player1.id}/view_decks?back_to=pairings`)}>
        <FontAwesomeIcon icon="eye" /> View decks
      </a> -->
      <span><FontAwesomeIcon icon="eye" /> View decks</span>
    {/if}
  {/if}
  <PlayerDisplay
    player={leftPlayer}
    {pairing}
    left_or_right="left"
    is_single_sided={stage.is_single_sided}
    show_ids={!stage.is_single_sided || pairing.player1.side !== null}
  />

  <!-- Score -->
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

  <!-- Player 2 -->
  <PlayerDisplay
    player={rightPlayer}
    {pairing}
    left_or_right="right"
    is_single_sided={stage.is_single_sided}
    show_ids={!stage.is_single_sided || pairing.player2.side !== null}
  />
  {#if stage.view_decks && !pairing.player1.side && pairing.player2.id}
    <!-- TODO: Implement once players pages exist -->
    <!-- <a href={resolve(`/players/{pairing.player2.id}/view_decks?back_to=pairings`)}>
      <FontAwesomeIcon icon="eye" /> View decks
    </a> -->
    <FontAwesomeIcon icon="eye" /> View decks
  {/if}

  <!-- Self-reporting -->
  <div class="col-sm-2">
    {#if pairing.policy.self_report}
      <SelfReportOptions {stage} {pairing} {reportScoreCallback} />
    {/if}
    {#if pairing.self_reports && pairing.self_reports.length !== 0}
      Report: {readableReportScore(
        pairing.self_reports[0],
        pairing.player1.side,
        stage.is_single_sided,
      )}
    {/if}
  </div>
</div>
