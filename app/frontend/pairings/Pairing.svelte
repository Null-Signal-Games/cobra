<script lang="ts">
  import { type Pairing, type Round, type Score, type Stage, type TournamentPolicies, scorePresets } from "./PairingsData";
  import PlayerName from "./PlayerName.svelte";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import SelfReportOptions from "./SelfReportOptions.svelte";
  import { redirectRequest } from "../utils/requests";

  interface Props {
    tournamentId: number;
    stage: Stage;
    round: Round;
    pairing: Pairing;
    tournamentPolicies?: TournamentPolicies;
    csrfToken?: string;
  }

  let { tournamentId, stage, round, pairing, tournamentPolicies, csrfToken }: Props = $props();

  let left_player = $state(pairing.player1);
  let right_player = $state(pairing.player2);
  if (pairing.player2.side == "corp" && stage.is_single_sided) {
    left_player = pairing.player2;
    right_player = pairing.player1;
  }

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
  <PlayerName player={left_player} left_or_right="left" />

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
            {#if left_player == pairing.player1}
              <input class="form-control" style="width: 2.5em;" bind:value={customScore.score1} />
            {:else}
              <input class="form-control" style="width: 2.5em;" bind:value={customScore.score2} />
            {/if}
          </div>

          <button class="btn btn-primary mx-2" onclick={(e) => submitScore(e, customScore)}><FontAwesomeIcon icon="flag-checkered" /> Save</button>

          <div>
            {#if right_player == pairing.player1}
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
  <PlayerName player={right_player} left_or_right="right" />
  {#if pairing.policy.view_decks && !pairing.player1.side}
    <a href="../players/{pairing.player2.id}/view_decks?back_to=pairings">
      <FontAwesomeIcon icon="eye" /> View decks
    </a>
  {/if}

  <!-- Self-reporting -->
  <div class="col-sm-2">
    {#if pairing.policy.self_report}
      <SelfReportOptions {tournamentId} {stage} {round} {pairing} />
    {/if}
    {#if pairing.self_report !== null}
      Report: {pairing.self_report.label}
    {/if}
  </div>
</div>
