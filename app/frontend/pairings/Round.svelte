<script lang="ts">
  import type { Stage, Round } from "./PairingsData";
  import Pairing from "./Pairing.svelte";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";

  interface Props {
    tournamentId: number;
    stage: Stage;
    round: Round;
    startExpanded: boolean;
    showReportedPairings: boolean;
  }

  let {
    tournamentId,
    stage,
    round,
    startExpanded,
    showReportedPairings = true,
  }: Props = $props();
</script>

<div class="card">
  <div class="card-header" role="tab">
    <div class="row">
      <div class="col-sm-9">
        <a data-toggle="collapse" href="#round{round.id}">
          <h5 class="mb-0">Round {round.number}</h5>
        </a>
      </div>
      <div class="col-sm-3">
        {round.pairings_reported} / {round.pairings.length} pairings reported
      </div>
    </div>
  </div>
  <div class="collapse{startExpanded ? ' show' : ''}" id="round{round.id}">
    <div class="col-12 my-3">
      <a class="btn btn-primary" href="{round.id}/pairings">
        <FontAwesomeIcon icon="list-ul" />
        Pairings by name
      </a>
      {#each round.pairings as pairing (pairing.id)}
        {#if showReportedPairings || pairing.score_label === "-"}
          <Pairing {tournamentId} {pairing} {round} {stage} />
        {/if}
      {/each}
    </div>
  </div>
</div>
