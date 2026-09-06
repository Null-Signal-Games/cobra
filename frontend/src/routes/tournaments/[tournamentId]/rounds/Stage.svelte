<script lang="ts">
  import Round from "./Round.svelte";
  import type { ScoreReport } from "$lib/model/ScoreReport";
  import type { Stage } from "$lib/model/Stage";
  import type { Tournament } from "$lib/model/Tournament";

  let {
    tournament,
    stage,
    startExpanded,
    reportScoreCallback,
  }: {
    tournament: Tournament;
    stage: Stage;
    startExpanded: boolean;
    reportScoreCallback?: (
      roundId: number,
      pairingId: number,
      report: ScoreReport,
      selfReport: boolean,
    ) => void;
  } = $props();
</script>

<div id={`stage${stage.id}`} class="accordion mb-3" role="tablist">
  <div class="row mb-1">
    <div class="col-sm-6 d-flex align-items-baseline gap-2">
      <h4>{stage.name}</h4>
    </div>
  </div>

  <!-- Rounds -->
  {#each stage.rounds as round, index (round.id)}
    <Round
      {tournament}
      {round}
      {stage}
      startExpanded={startExpanded && index === stage.rounds.length - 1}
      {reportScoreCallback}
    />
  {/each}
</div>
