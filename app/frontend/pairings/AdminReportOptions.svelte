<script lang="ts">
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import type { Pairing, Stage } from "./PairingsData";
  import { scorePresets, type ScoreReport } from "./SelfReport";

  let {
    stage,
    pairing,
    submitScore,
  }: {
    stage: Stage;
    pairing: Pairing;
    submitScore: (score: ScoreReport) => void;
  } = $props();

  let leftPlayer = $state(pairing.player1);
  let rightPlayer = $state(pairing.player2);
  if (pairing.player2.side == "corp" && stage.is_single_sided) {
    leftPlayer = pairing.player2;
    rightPlayer = pairing.player1;
  }
  let showScorePresets = $state(!pairing.reported);
  let customScore: ScoreReport = $state({
    score1: pairing.score1,
    score2: pairing.score2,
    intentional_draw: pairing.intentional_draw,
    two_for_one: pairing.two_for_one,
    score1_corp: 0,
    score2_runner: 0,
    score1_runner: 0,
    score2_corp: 0,
  });

  function toggleShowScorePresets() {
    showScorePresets = !showScorePresets;
  }
</script>

<div class="col-sm-5 centre_score">
  {#if showScorePresets}
    <div>
      {#each scorePresets(stage, pairing) as score (score.label)}
        <button
          type="button"
          class="btn btn-primary mr-1"
          onclick={() => {
            submitScore(score);
          }}
        >
          {score.label}
        </button>
      {/each}
      <button
        type="button"
        class="btn btn-primary"
        onclick={toggleShowScorePresets}>...</button
      >
    </div>
  {:else}
    <div class="form-row justify-content-center">
      <div>
        {#if leftPlayer == pairing.player1}
          <input
            id="pairing_score1"
            class="form-control"
            style="width: 2.5em;"
            bind:value={customScore.score1}
          />
        {:else}
          <input
            id="pairing_score2"
            class="form-control"
            style="width: 2.5em;"
            bind:value={customScore.score2}
          />
        {/if}
      </div>

      <button
        type="button"
        class="btn btn-primary mx-2"
        onclick={() => {
          submitScore(customScore);
        }}><FontAwesomeIcon icon="flag-checkered" /> Save</button
      >

      <div>
        {#if rightPlayer == pairing.player1}
          <input
            id="pairing_score1"
            class="form-control"
            style="width: 2.5em;"
            bind:value={customScore.score1}
          />
        {:else}
          <input
            id="pairing_score2"
            class="form-control"
            style="width: 2.5em;"
            bind:value={customScore.score2}
          />
        {/if}
      </div>
      <button class="btn btn-primary ml-2" onclick={toggleShowScorePresets}
        >...</button
      >
    </div>
    <div class="form-row justify-content-center">
      <div class="form-check form-check-inline">
        <input
          id="pairing{pairing.id}ID"
          type="checkbox"
          class="form-check-input"
          bind:checked={customScore.intentional_draw}
        />
        <label for="pairing{pairing.id}ID" class="form-check-label"
          >Intentional Draw</label
        >
      </div>
      {#if !stage.is_single_sided}
        <div class="form-check form-check-inline">
          <input
            id="pairing{pairing.id}_241"
            type="checkbox"
            class="form-check-input"
            bind:checked={customScore.two_for_one}
          />
          <label for="pairing{pairing.id}_241" class="form-check-label"
            >2 for 1</label
          >
        </div>
      {/if}
    </div>
  {/if}
</div>
