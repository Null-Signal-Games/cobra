<script lang="ts">
  import { onMount } from "svelte";
  import { type Pairing, type Player, type Round, type Score, SelfReport, type Stage, type TournamentPolicies, readableReportScore, scorePresets } from "./PairingsData";
  import PlayerName from "./PlayerName.svelte";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import SelfReportOptions from "./SelfReportOptions.svelte";
  import ModalDialog from "../widgets/ModalDialog.svelte";
  import { redirectRequest } from "../utils/requests";
    import { report } from "process";

  interface Props {
    tournamentId: number;
    stage: Stage;
    round: Round;
    pairing: Pairing;
    tournamentPolicies?: TournamentPolicies;
    csrfToken?: string;
  }

  let { tournamentId, stage, round, pairing, tournamentPolicies, csrfToken }: Props = $props();

  let leftPlayer = $state(pairing.player1);
  let rightPlayer = $state(pairing.player2);
  if (pairing.player2.side == "corp" && stage.is_single_sided) {
    leftPlayer = pairing.player2;
    rightPlayer = pairing.player1;
  }
  let leftPlayerReport: SelfReport | undefined = $state(new SelfReport());
  let rightPlayerReport: SelfReport | undefined = $state(new SelfReport());
  let playersReported = $state(false);
  let selfReportsMatch = $state(false);

  let showScorePresets = $state(!pairing.reported);
  let customScore: Score = $state({
    score1: pairing.score1,
    score2: pairing.score2,
    intentional_draw: pairing.intentional_draw,
    two_for_one: pairing.two_for_one,
    score1_corp: 0,
    score2_runner: 0,
    score1_runner: 0,
    score2_corp: 0
  });

  onMount(() => {
    leftPlayerReport = pairing.self_reports?.find((r) => r.report_player_id === leftPlayer.user_id);
    rightPlayerReport = pairing.self_reports?.find((r) => r.report_player_id === rightPlayer.user_id);
    playersReported = leftPlayerReport !== undefined && rightPlayerReport !== undefined;
    selfReportsMatch = leftPlayerReport?.score1 === rightPlayerReport?.score1
      && leftPlayerReport?.score2 === rightPlayerReport?.score2
      && leftPlayerReport?.score1_corp === rightPlayerReport?.score1_corp
      && leftPlayerReport?.score2_corp === rightPlayerReport?.score2_corp
      && leftPlayerReport?.score1_runner === rightPlayerReport?.score1_runner
      && leftPlayerReport?.score2_runner === rightPlayerReport?.score2_runner;
  });

  function toggleShowScorePresets(e: MouseEvent) {
    e.preventDefault();

    showScorePresets = !showScorePresets;
  }

  function submitScore(e: MouseEvent, score: Score) {
    let params: String[] = [];
    Object.entries(score).forEach(
      ([key, value]) => params.push(`pairing[${key}]=${value}`));

    redirectRequest(
      e,
      `/tournaments/${tournamentId}/rounds/${round.id}/pairings/${pairing.id}/report?${params.join("&")}`,
      "POST",
      csrfToken,
    );
  }

  function deletePairing(e: MouseEvent) {
    if (!confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    redirectRequest(
      e,
      `/tournaments/${tournamentId}/rounds/${round.id}/pairings/${pairing.id}`,
      "DELETE",
      csrfToken,
    );
  }

  function resetReports(e: MouseEvent) {
    if (!confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    redirectRequest(
      e,
      `/tournaments/${tournamentId}/rounds/${round.id}/pairings/${pairing.id}/reset_self_report`,
      "DELETE",
      csrfToken,
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
  </div>

  <!-- Player 1 -->
  {#if pairing.policy.view_decks}
    {#if pairing.player1.side}
      <a href="{round.id}/pairings/{pairing.id}/view_decks?back_to=pairings">
        <FontAwesomeIcon icon="eye" /> View decks
      </a>
    {:else}
      <a href="../players/{pairing.player1.id}/view_decks?back_to=pairings">
        <FontAwesomeIcon icon="eye" /> View decks
      </a>
    {/if}
  {/if}
  <PlayerName player={leftPlayer} left_or_right="left" />

  <!-- Score -->
  {#if tournamentPolicies?.update && (!stage.is_single_sided || pairing.player1.side)}
    <!-- Admin reporting controls -->
    <div class="col-sm-5 centre_score">
      {#if showScorePresets}
        <div>
          {#each scorePresets(stage, pairing) as score}
            <button class="btn btn-primary mr-1" onclick={(e) => submitScore(e, score)}>{score.label}</button>
          {/each}
          <button class="btn btn-primary" onclick={toggleShowScorePresets}>...</button>
        </div>
      {:else}
        <div class="form-row justify-content-center">
          <div>
            {#if leftPlayer == pairing.player1}
              <input class="form-control" style="width: 2.5em;" bind:value={customScore.score1} />
            {:else}
              <input class="form-control" style="width: 2.5em;" bind:value={customScore.score2} />
            {/if}
          </div>

          <button class="btn btn-primary mx-2" onclick={(e) => submitScore(e, customScore)}><FontAwesomeIcon icon="flag-checkered" /> Save</button>

          <div>
            {#if rightPlayer == pairing.player1}
              <input class="form-control" style="width: 2.5em;" bind:value={customScore.score1} />
            {:else}
              <input class="form-control" style="width: 2.5em;" bind:value={customScore.score2} />
            {/if}
          </div>

          <button class="btn btn-primary ml-2" onclick={toggleShowScorePresets}>...</button>
        </div>
        <div class="form-row justify-content-center">
          <div class="form-check form-check-inline">
            <input id="pairing{pairing.id}ID" type="checkbox" class="form-check-input" bind:checked={customScore.intentional_draw} />
            <label for="pairing{pairing.id}ID" class="form-check-label">Intentional Draw</label>
          </div>
          {#if !stage.is_single_sided}
            <div class="form-check form-check-inline">
              <input id="pairing{pairing.id}_241" type="checkbox" class="form-check-input" bind:checked={customScore.two_for_one} />
              <label for="pairing{pairing.id}_241" class="form-check-label">2 for 1</label>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <!-- Player view -->
    <div class="col-sm-2 centre_score">
      {pairing.score_label}
      {#if pairing.intentional_draw}
        <span class="badge badge-pill badge-secondary score-badge">ID</span>
      {/if}
      {#if pairing.two_for_one}
        <span class="badge badge-pill badge-secondary score-badge">2 for 1</span>
      {/if}
    </div>
  {/if}

  <!-- Player 2 -->
  <PlayerName player={rightPlayer} left_or_right="right" />
  {#if pairing.policy.view_decks && !pairing.player1.side}
    <a href="../players/{pairing.player2.id}/view_decks?back_to=pairings">
      <FontAwesomeIcon icon="eye" /> View decks
    </a>
  {/if}

  <!-- Self-reporting -->
  <div class="col-sm-2">
    {#if tournamentPolicies?.update}
      <button
        type="button"
        class="btn btn-primary mr-2"
        data-toggle="modal"
        data-target="#reports{pairing.id}"
      >
        Reports
        {#if !pairing.reported && pairing.self_reports?.length == 2 && pairing.self_reports[0].matches(pairing.self_reports[1])}
          <FontAwesomeIcon icon="exclamation-triangle" />
        {/if}
      </button>
      <button class="btn btn-danger" onclick={deletePairing}>
        <FontAwesomeIcon icon="trash" />
      </button>
    {:else}
      {#if pairing.policy.self_report}
        <SelfReportOptions {tournamentId} {stage} {round} {pairing} />
      {/if}
      {#if pairing.self_reports && pairing.self_reports.length !== 0}
        Report: {pairing.self_reports[0].label}
      {/if}
    {/if}
  </div>

  {#snippet playerReport(player: Player, report: SelfReport | undefined)}
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

  {#snippet acceptPlayerReportButton(player: Player, report: SelfReport)}
    <button
      type="button"
      class="btn btn-primary"
      onclick={(e) => submitScore(
        e,
        {
          score1: report.score1,
          score1_corp: 0,
          score1_runner: 0,
          score2: report.score2,
          score2_corp: 0,
          score2_runner: 0
        })}
      disabled={pairing.reported}
    >
      <FontAwesomeIcon icon="check" /> Accept {player.name}
    </button>
  {/snippet}

  <ModalDialog id="reports{pairing.id}" headerText="Player Self Reports">
    <p>
      {@render playerReport(leftPlayer, leftPlayerReport)}
    </p>
    <p>
      {@render playerReport(rightPlayer, rightPlayerReport)}
    </p>

    {#snippet footer()}
      {#if leftPlayerReport}
        {@render acceptPlayerReportButton(leftPlayer, leftPlayerReport)}
      {/if}
      {#if rightPlayerReport}
        {@render acceptPlayerReportButton(rightPlayer, rightPlayerReport)}
      {/if}
      {#if playersReported && !selfReportsMatch}
        <button class="btn btn-primary" onclick={resetReports} title="Reset self reports of pairing">
          <FontAwesomeIcon icon="undo" /> Reset
        </button>
      {/if}
    {/snippet}
  </ModalDialog>
</div>
