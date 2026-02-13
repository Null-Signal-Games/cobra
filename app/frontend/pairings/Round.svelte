<script lang="ts">
  import type {
    Round,
    Stage,
    Tournament,
    PairingsContext,
  } from "./PairingsData";
  import Pairing from "./Pairing.svelte";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import { showReportedPairings } from "../utils/ShowReportedPairings";
  import RoundTimerControls from "./RoundTimerControls.svelte";
  import { getContext } from "svelte";
  import type { ScoreReport } from "./SelfReport";

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

  const pairingsContext: PairingsContext = getContext("pairingsContext");

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
        {#if pairingsContext.showOrganizerView}
          <a
            class="btn btn-warning"
            href="/beta/tournaments/{tournament.id}/rounds/{round.id}"
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
            href="/tournaments/{tournament.id}/rounds/{round.id}/pairings/match_slips"
          >
            <FontAwesomeIcon icon="flag-checkered" /> Match slips
          </a>
          <a
            class="btn btn-primary"
            href="/tournaments/{tournament.id}/rounds/{round.id}/pairings/sharing"
          >
            <FontAwesomeIcon icon="share" /> Export markdown
          </a>
        {/if}
        <a
          class="btn btn-primary"
          href="/tournaments/{tournament.id}/rounds/{round.id}/pairings"
        >
          <FontAwesomeIcon icon="list-ul" /> Pairings by name
        </a>
      </div>

      <!-- Timer controls -->
      {#if pairingsContext.showOrganizerView && !round.completed}
        <RoundTimerControls {round} updateCallback={updateTimerCallback} />
      {/if}

      <!-- Pairings -->
      {#each round.pairings as pairing (pairing.id)}
        {#if !pairingsContext.showOrganizerView || $showReportedPairings || !pairing.reported}
          {#if pairingsContext.showOrganizerView}
            <hr />
          {/if}
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
