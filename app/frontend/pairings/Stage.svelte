<script lang="ts">
  import Round from "./Round.svelte";
  import type { Stage, Tournament, TournamentPolicies } from "./PairingsData";
  import FontAwesomeIcon from "../widgets/FontAwesomeIcon.svelte";
  import { redirectRequest } from "../utils/network";

  interface Props {
    stage: Stage;
    tournamentId: number;
    tournament: Tournament;
    startExpanded: boolean;
    showReportedPairings?: boolean;
    tournamentPolicies?: TournamentPolicies;
    csrfToken: string;
  }

  let {
    stage,
    tournamentId,
    tournament,
    startExpanded,
    showReportedPairings = true,
    tournamentPolicies,
    csrfToken,
  }: Props = $props();

  function deleteStage(e: MouseEvent) {
    e.preventDefault();
    
    if (
      !confirm(
        "Are you sure? This cannot be reversed and all rounds will be deleted!",
      )
    ) {
      return;
    }

    redirectRequest(`/tournaments/${tournamentId}/stages/${stage.id}`, "DELETE", csrfToken);
  }
</script>

<div class="accordion mb-3" role="tablist">
  <div class="row mb-1">
    <div class="col-sm-10 d-flex align-items-baseline gap-2">
      <h4>{stage.name}</h4>
    </div>

    <!-- Admin controls -->
    {#if tournamentPolicies?.update}
      <div class="col-sm-2">
        {#if !stage.is_elimination && tournamentPolicies?.custom_table_numbering}
          <a
            href="/tournaments/{tournamentId}/stages/{stage.id}"
            class="btn btn-warning mx-1"
          >
            <FontAwesomeIcon icon="pencil" />
          </a>
        {/if}
        <button class="btn btn-danger mx-1" onclick={deleteStage}>
          <FontAwesomeIcon icon="trash" />
        </button>
      </div>
    {/if}
  </div>

  <!-- Rounds -->
  {#if !tournamentPolicies?.update && stage.rounds.length > 0 && stage.rounds[stage.rounds.length - 1].pairings.length > 30}
    <div class="alert alert-info">
      Due to the number of players, only the most recent round will be displayed
      on this page to help page load.
    </div>
    <Round
      {tournamentId}
      {tournament}
      round={stage.rounds[stage.rounds.length - 1]}
      {stage}
      {startExpanded}
      {showReportedPairings}
      {tournamentPolicies}
      {csrfToken}
    />
  {:else}
    {#each stage.rounds.filter((r) => r.id) as round, index (round.id)}
      <Round
        {tournamentId}
        {tournament}
        {round}
        {stage}
        startExpanded={startExpanded && index === stage.rounds.length - 1}
        {showReportedPairings}
        {tournamentPolicies}
        {csrfToken}
      />
    {/each}
  {/if}
</div>
