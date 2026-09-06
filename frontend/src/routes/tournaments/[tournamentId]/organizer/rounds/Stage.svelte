<script lang="ts">
  import Round from "./Round.svelte";
  import FontAwesomeIcon from "$lib/components/FontAwesomeIcon.svelte";
  import type { ScoreReport } from "$lib/model/ScoreReport";
  import type { Stage } from "$lib/model/Stage";
  import type { Tournament, TournamentPolicies } from "$lib/model/Tournament";
  import { resolve } from "$app/paths";

  let {
    tournament,
    stage,
    startExpanded,
    tournamentPolicies,
    deletePairingCallback,
    changePlayerSideCallback,
    reportScoreCallback,
    completeRoundCallback,
    updateTimerCallback,
  }: {
    tournament: Tournament;
    stage: Stage;
    startExpanded: boolean;
    tournamentPolicies?: TournamentPolicies;
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
    completeRoundCallback?: (roundId: number) => void;
    updateTimerCallback?: (
      roundId: number,
      length_minutes: number,
      operation: string,
    ) => void;
  } = $props();
</script>

<div id={`stage${stage.id}`} class="accordion mb-3" role="tablist">
  <div class="row mb-1">
    <div class="col-sm-6 d-flex align-items-baseline gap-2">
      <h4>{stage.name}</h4>
    </div>

    <!-- Admin controls -->
    <div class="col-sm-6 d-flex justify-content-end" aria-label="admin controls">
      {#if !stage.is_elimination && tournamentPolicies?.custom_table_numbering}
        <a
          href={resolve(`/tournaments/${tournament.id}/stages/${stage.id}`)}
          class="btn btn-warning mx-1"
          aria-label="edit stage"
        >
          <FontAwesomeIcon icon="pencil" />
          Edit Stage
        </a>
      {/if}
    </div>
  </div>

  <!-- Rounds -->
  {#each stage.rounds as round, index (round.id)}
    <Round
      {tournament}
      {round}
      {stage}
      startExpanded={startExpanded && index === stage.rounds.length - 1}
      {deletePairingCallback}
      {changePlayerSideCallback}
      {reportScoreCallback}
      completeCallback={completeRoundCallback}
      {updateTimerCallback}
    />
  {/each}
</div>
