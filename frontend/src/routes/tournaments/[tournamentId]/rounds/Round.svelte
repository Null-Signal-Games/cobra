<script lang="ts">
  import Pairing from "./Pairing.svelte";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import type { Tournament } from "$lib/model/Tournament";
  import type { Round } from "$lib/model/Round";
  import type { ScoreReport } from "$lib/model/ScoreReport";
  import type { Stage } from "$lib/model/Stage";
  import { resolve } from "$app/paths";

  let {
    tournament,
    stage,
    round,
    startExpanded,
    reportScoreCallback,
  }: {
    tournament: Tournament;
    stage: Stage;
    round: Round;
    startExpanded: boolean;
    reportScoreCallback?: (
      roundId: number,
      pairingId: number,
      report: ScoreReport,
      selfReport: boolean,
    ) => void;
  } = $props();
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
      <div aria-label="round controls">
        <a
          class="btn btn-primary"
          href={resolve(`/tournaments/${tournament.id}/rounds/${round.id}/pairings`)}
        >
          <FontAwesomeIcon icon="list-ul" /> Pairings by name
        </a>
      </div>

      <!-- Pairings -->
      {#each round.pairings as pairing (pairing.id)}
        <Pairing
          {tournament}
          {pairing}
          {round}
          {stage}
          reportScoreCallback={(
            pairingId: number,
            report: ScoreReport,
            selfReport: boolean,
          ) => {
            reportScoreCallback?.(round.id, pairingId, report, selfReport);
          }}
        />
      {/each}
    </div>
  </div>
</div>
