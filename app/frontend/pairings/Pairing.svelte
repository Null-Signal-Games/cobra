<script lang="ts">
  import { onMount } from "svelte";
  import { type Pairing, type Player, type Round, type Stage, Tournament, type TournamentPolicies } from "./PairingsData";
  import { type ScoreReport, readableReportScore, reportsMatch, scorePresets } from "./SelfReport";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import SelfReportOptions from "./SelfReportOptions.svelte";
  import ModalDialog from "../widgets/ModalDialog.svelte";
  import Identity from "../identities/Identity.svelte";
  import { showIdentities } from "./ShowIdentities";
  import { redirectRequest } from "../utils/network";

  let {
    tournamentId,
    tournament,
    stage,
    round,
    pairing,
    tournamentPolicies,
    csrfToken
  }: {
    tournamentId: number;
    tournament: Tournament;
    stage: Stage;
    round: Round;
    pairing: Pairing;
    tournamentPolicies?: TournamentPolicies;
    csrfToken: string;
  } = $props();

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

  let showScorePresets = $state(!pairing.reported);
  let customScore: ScoreReport = $state({
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

  function changePlayerSide(e: MouseEvent, side: string, player: Player) {
    if (!confirm(`Are you sure you want to switch ${player.name} to ${side}?`)) {
      return;
    }

    let sideValue = side;
    if (player !== pairing.player1) {
      sideValue = side === "corp" ? "runner" : "corp";
    }

    void redirectRequest(
      `/tournaments/${tournamentId}/rounds/${round.id}/pairings/${pairing.id}/report`,
      "POST",
      csrfToken,
      { side: `player1_is_${sideValue}` }
    );
  }

  function submitScore(e: MouseEvent, score: ScoreReport) {
    e.preventDefault();

    void redirectRequest(
      `/tournaments/${tournamentId}/rounds/${round.id}/pairings/${pairing.id}/report`,
      "POST",
      csrfToken,
      score
    );
  }

  function deletePairing(e: MouseEvent) {
    e.preventDefault();

    if (!confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    void redirectRequest(
      `/tournaments/${tournamentId}/rounds/${round.id}/pairings/${pairing.id}`,
      "DELETE",
      csrfToken,
    );
  }

  function resetReports(e: MouseEvent) {
    e.preventDefault();

    if (!confirm("Are you sure? This cannot be reversed.")) {
      return;
    }

    void redirectRequest(
      `/tournaments/${tournamentId}/rounds/${round.id}/pairings/${pairing.id}/reset_self_report`,
      "DELETE",
      csrfToken,
    );
  }
</script>

{#snippet playerDisplay(player: Player, left_or_right: string)}
  <div class="col-sm {left_or_right}_player_name">
    <!-- Name -->
    {player.name_with_pronouns}

    <!-- Side -->
    {#if stage.is_single_sided && pairing.player1.id && pairing.player2.id}
      <br />
      {#if tournamentPolicies?.update}
        {#snippet setSideButton(side: string, player: Player)}
          <button
            class="btn btn-sm mr-1 {player.side === side ? "btn-dark" : "btn-outline-dark"}"
            onclick={(e) => { changePlayerSide(e, side, player); }}
          >
            {#if player.side === side}
              <FontAwesomeIcon icon="check" />
            {/if}
            {side == "corp" ? "Corp" : "Runner"}
          </button>
        {/snippet}

        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render setSideButton("corp", player)}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
        {@render setSideButton("runner", player)}
      {:else if player.side_label}
        {player.side_label}
      {/if}
    {/if}
    
    <!-- IDs -->
    <div class="ids" style={$showIdentities ? "display: block;" : ""}>
      {#if stage.is_single_sided}
        <Identity
          identity={player.side == "corp" ? player.corp_id : player.runner_id}
          name_if_missing="Unspecified"
          icon_if_missing="interrupt"
        />
      {:else}
        <Identity
          identity={player.corp_id}
          name_if_missing="Unspecified"
          icon_if_missing="interrupt" />
        <Identity
          identity={player.runner_id}
          name_if_missing="Unspecified"
          icon_if_missing="interrupt" />
      {/if}
    </div>
  </div>
{/snippet}

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

    {#if tournamentPolicies?.update && tournament.allow_streaming_opt_out}
      {#if pairing.player1.include_in_stream && pairing.player2.include_in_stream}
        <span title="May be included in video coverage.">
          <FontAwesomeIcon icon="video-camera" cssClass="text-success" />
        </span>
      {:else if stage.is_elimination}
        <span title="One or both players request not to be included in video coverage, but were informed this may not be possible in the cut.">
          <FontAwesomeIcon icon="video-camera" cssClass="text-warning" />
        </span>
      {:else}
        <span title="One or both players request not to not be included in video coverage.">
          <FontAwesomeIcon icon="video-camera" cssClass="text-secondary" />
          <FontAwesomeIcon icon="ban" cssClass="text-danger" />
        </span>
      {/if}
    {/if}
  </div>

  <!-- Player 1 -->
  {#if pairing.policy.view_decks}
    {#if tournamentPolicies?.update}
      {#if stage.is_single_sided}
        <a href="/tournaments/{tournamentId}/rounds/{round.id}/pairings/{pairing.id}/view_decks?back_to=rounds">
          <FontAwesomeIcon icon="eye" /> View decks
        </a>
      {/if}
    {:else}
      {#if pairing.player1.side}
        <a href="/tournaments/{tournamentId}/rounds/{round.id}/pairings/{pairing.id}/view_decks?back_to=pairings">
          <FontAwesomeIcon icon="eye" /> View decks
        </a>
      {:else}
        <a href="../players/{pairing.player1.id}/view_decks?back_to=pairings">
          <FontAwesomeIcon icon="eye" /> View decks
        </a>
      {/if}
    {/if}
  {/if}
  <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
  {@render playerDisplay(leftPlayer, "left")}

  <!-- Score -->
  {#if tournamentPolicies?.update && (!stage.is_single_sided || pairing.player1.side)}
    <!-- Admin reporting controls -->
    <div class="col-sm-5 centre_score">
      {#if showScorePresets}
        <div>
          {#each scorePresets(stage, pairing) as score (score.label)}
            <button class="btn btn-primary mr-1" onclick={(e) => { submitScore(e, score); }}>{score.label}</button>
          {/each}
          <button class="btn btn-primary" onclick={toggleShowScorePresets}>...</button>
        </div>
      {:else}
        <div class="form-row justify-content-center">
          <div>
            {#if leftPlayer == pairing.player1}
              <input id="pairing_score1" class="form-control" style="width: 2.5em;" bind:value={customScore.score1} />
            {:else}
              <input id="pairing_score2" class="form-control" style="width: 2.5em;" bind:value={customScore.score2} />
            {/if}
          </div>

          <button class="btn btn-primary mx-2" onclick={(e) => { submitScore(e, customScore); }}><FontAwesomeIcon icon="flag-checkered" /> Save</button>

          <div>
            {#if rightPlayer == pairing.player1}
              <input id="pairing_score1" class="form-control" style="width: 2.5em;" bind:value={customScore.score1} />
            {:else}
              <input id="pairing_score2" class="form-control" style="width: 2.5em;" bind:value={customScore.score2} />
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
  <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -->
  {@render playerDisplay(rightPlayer, "right")}
  {#if !tournamentPolicies?.update && pairing.policy.view_decks && !pairing.player1.side && pairing.player2.id}
    <a href="../players/{pairing.player2.id}/view_decks?back_to=pairings">
      <FontAwesomeIcon icon="eye" /> View decks
    </a>
  {/if}

  <!-- Self-reporting -->
  {#if tournamentPolicies?.update}
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
      <button class="btn btn-danger" onclick={deletePairing}>
        <FontAwesomeIcon icon="trash" />
      </button>
    </div>
  {:else}
    <div class="col-sm-2">
      {#if pairing.policy.self_report}
        <SelfReportOptions {tournamentId} {stage} {round} {pairing} {csrfToken} />
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
      onclick={(e) => { submitScore(e, report); }}
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
        <button class="btn btn-primary" onclick={resetReports} title="Reset self reports of pairing">
          <FontAwesomeIcon icon="undo" /> Reset
        </button>
      {/if}
    {/snippet}
  </ModalDialog>
</div>
