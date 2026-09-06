<script lang="ts">
  import Pairing from "./Pairing.svelte";
  import RoundTimerControls from "./RoundTimerControls.svelte";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import type { Tournament } from "$lib/model/Tournament";
  import type { Round } from "$lib/model/Round";
  import type { ScoreReport } from "$lib/model/ScoreReport";
  import type { Stage } from "$lib/model/Stage";
  import { resolve } from "$app/paths";
  import { showReportedPairings } from "$lib/utils/ShowReportedPairings";

  let {
    tournament,
    stage,
    round,
    startExpanded,
    deletePairingCallback,
    changePlayerSideCallback,
    reportScoreCallback,
    completeCallback,
    updateTimerCallback,
  }: {
    tournament: Tournament;
    stage: Stage;
    round: Round;
    startExpanded: boolean;
    deletePairingCallback?: (roundId: number, pairingId: number) => void;
    changePlayerSideCallback?: (
      roundId: number,
      pairingId: number,
      side: string,
    ) => void;
    reportScoreCallback?: (
      roundId: number,
      pairingId: number,
      report: ScoreReport,
      selfReport: boolean,
    ) => void;
    completeCallback?: (roundId: number) => void;
    updateTimerCallback?: (
      roundId: number,
      length_minutes: number,
      operation: string,
    ) => void;
  } = $props();

  function complete() {
    if (
      round.pairings.length == round.pairings_reported ||
      confirm(
        `${round.pairings.length - round.pairings_reported} pairings have not been reported. Are you sure you want to complete this round?`,
      )
    ) {
      completeCallback?.(round.id);
    }
  }
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
        <!-- Admin controls -->
        <a
          class="btn btn-warning"
          href={resolve(`/tournaments/${tournament.id}/rounds/${round.id}`)}
        >
          <FontAwesomeIcon icon="pencil" /> Edit
        </a>
        {#if !round.completed}
          <button type="button" class="btn btn-warning" onclick={complete}>
            <FontAwesomeIcon icon="check" /> Complete
          </button>
        {/if}
        <a
          class="btn btn-primary"
          href={resolve(`/tournaments/${tournament.id}/rounds/${round.id}/pairings/match_slips`)}
        >
          <FontAwesomeIcon icon="flag-checkered" /> Match slips
        </a>
        <a
          class="btn btn-primary"
          href={resolve(`/tournaments/${tournament.id}/rounds/${round.id}/pairings/sharing`)}
        >
          <FontAwesomeIcon icon="share" /> Export markdown
        </a>
        <a
          class="btn btn-primary"
          href={resolve(`/tournaments/${tournament.id}/rounds/${round.id}/pairings`)}
        >
          <FontAwesomeIcon icon="list-ul" /> Pairings by name
        </a>
      </div>

      <!-- Timer controls -->
      {#if !round.completed}
        <RoundTimerControls {round} updateCallback={updateTimerCallback} />
      {/if}

      <!-- Pairings -->
      {#each round.pairings as pairing (pairing.id)}
        {#if $showReportedPairings || !pairing.reported}
          <hr />
          
          <Pairing
            {tournament}
            {pairing}
            {round}
            {stage}
            deleteCallback={(pairingId: number) => {
              deletePairingCallback?.(round.id, pairingId);
            }}
            changePlayerSideCallback={(pairingId: number, side: string) => {
              changePlayerSideCallback?.(round.id, pairingId, side);
            }}
            reportScoreCallback={(
              pairingId: number,
              report: ScoreReport,
              selfReport: boolean,
            ) => {
              reportScoreCallback?.(round.id, pairingId, report, selfReport);
            }}
          />
        {/if}
      {/each}
    </div>
  </div>
</div>
