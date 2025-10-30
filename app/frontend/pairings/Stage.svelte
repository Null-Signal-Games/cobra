<script lang="ts">
  import Round from "./Round.svelte";
  import type { Stage } from "./PairingsData";

  interface Props {
    stage: Stage;
    tournamentId: number;
    startExpanded: boolean;
    showReportedPairings?: boolean;
  }

  let {
    stage,
    tournamentId,
    startExpanded,
    showReportedPairings = true,
  }: Props = $props();
</script>

<div class="accordion mb-3" role="tablist">
  <div class="row mb-1">
    <div class="col-sm-11 d-flex align-items-baseline gap-2">
      <h4>{stage.name}</h4>
    </div>
  </div>
  {#each stage.rounds.filter((r) => r.id) as round, index (round.id)}
    <Round
      {tournamentId}
      {round}
      {stage}
      startExpanded={startExpanded && index === stage.rounds.length - 1}
      {showReportedPairings}
    />
  {/each}
</div>
